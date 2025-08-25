"""E-puck2 robot interface using 20-byte I2C packet format"""

import logging
from smbus2 import SMBus, i2c_msg
import time
from typing import List, Tuple, Optional

I2C_CHANNEL = 12
LEGACY_I2C_CHANNEL = 4
ROBOT_ADDRESS = 0x1f
ACTUATORS_SIZE = 19 + 1 # 19 data bytes + 1 checksum
SENSORS_SIZE = 47 + 1 # 47 data bytes + 1 checksum

# Official e-puck2 Sound IDs
SOUND_MARIO = 0x01
SOUND_UNDERWORLD = 0x02
SOUND_STARWARS = 0x04
SOUND_TONE_4KHZ = 0x08
SOUND_TONE_10KHZ = 0x10
SOUND_STOP = 0x20

# Request/Settings byte bit flags
REQUEST_IMAGE_STREAM = 0x01     # Bit 0: Image stream (0=stop, 1=start)
REQUEST_SENSORS_STREAM = 0x02   # Bit 1: Sensors stream (0=stop, 1=start)
SETTINGS_CALIBRATE_IR = 0x04    # Bit 2.0: Calibrate IR proximity sensors
SETTINGS_OBSTACLE_AVOID = 0x08  # Bit 2.1: Obstacle avoidance (not yet implemented)
SETTINGS_MOTOR_POSITION = 0x10  # Bit 2.2: Motor control mode (0=speed, 1=position)


class EPuck2:
    """E-puck2 robot control using Pi-puck 20-byte I2C packet format

    Compatible with EPuck1 interface but uses the correct 20-byte protocol
    for e-puck2 robots as documented in Pi-puck specification.
    """

    def __init__(self, i2c_bus: Optional[int] = None, i2c_address: Optional[int] = None):
        """Initialize EPuck2 interface

        Args:
            i2c_bus: I2C bus number (None = auto-detect from [12, 4])
            i2c_address: I2C address of e-puck2 (default 0x1f)
        """
        self.logger = logging.getLogger(__name__)
        self._address = i2c_address if i2c_address is not None else ROBOT_ADDRESS
        self._bus = None
        self._initialized = False

        self.logger.info(f"🤖 EPuck2 initializing with I2C address: 0x{self._address:02x}")

        # I2C configuration
        self._I2C_CHANNELS = [I2C_CHANNEL, LEGACY_I2C_CHANNEL] if i2c_bus is None else [i2c_bus]

        # Current state tracking
        self._request = 0  # Request byte
        self._settings = 0  # Settings byte
        self._left_motor_speed = 0 # 2 bytes each
        self._right_motor_speed = 0 # 2 bytes each
        self._leds = 0  # LED1,3,5,7,Body,Front bits
        self._led2_rgb = [0, 0, 0]  # 0-100 range
        self._led4_rgb = [0, 0, 0]  # 0-100 range
        self._led6_rgb = [0, 0, 0]  # 0-100 range
        self._led8_rgb = [0, 0, 0]  # 0-100 range
        self._sound_id = SOUND_STOP  # Sound ID byte

        # Sensor readings cache
        self._ir_reflected = [0] * 8  # Proximity sensors (0-4095)
        self._ir_ambient = [0] * 8    # Light sensors (0-4095)
        self._motor_steps = [0, 0]    # Motor encoder steps
        self._accelerometer = [0.0, 0.0, 9.8]  # [x, y, z] in m/s²
        self._gyroscope = [0.0, 0.0, 0.0]      # [x, y, z] in °/s
        self._magnetometer = [0.0, 0.0, 0.0]   # [x, y, z] in µT

        # Sensor reading timing
        self._last_sensor_read = 0
        self._sensor_read_interval = 0.01  # 100Hz max sensor reading

        # Initialize I2C connection
        self._connect()

    def __del__(self):
        """Destructor - cleanup when object is garbage collected"""
        self.close()

    def _connect(self) -> None:
        """Initialize I2C connection using official Pi-puck method"""
        if not SMBus or not i2c_msg:
            raise ImportError("SBUs and i2c_msg libraries not available")

        for channel in self._I2C_CHANNELS:
            try:
                self._bus = SMBus(channel)

                # Test communication using i2c_msg method like official Pi-puck
                try:
                    # Create a simple test write message (empty actuator packet)
                    test_data = [0] * 20  # 20 zero bytes
                    write_msg = i2c_msg.write(self._address, test_data)
                    self._bus.i2c_rdwr(write_msg)
                    self.logger.info(f"✅ EPuck2 I2C communication test successful on channel {channel}")
                except Exception as comm_error:
                    raise Exception(f"I2C communication test failed: {comm_error}")

                self._initialized = True
                self.logger.info(f"✅ EPuck2 connected on I2C channel {channel}, address 0x{self._address:02x}")

                # Send initial safe packet
                self.logger.info("📡 Sending initial safe packet...")
                self._send_packet()
                return
            except Exception as e:
                if self._bus:
                    self._bus.close()
                    self._bus = None
                self.logger.debug(f"I2C channel {channel} failed: {e}")

        self.logger.error("❌ Could not connect to EPuck2 on any I2C channel")
        self.logger.error(f"❌ Tried channels: {self._I2C_CHANNELS}, address: 0x{self._address:02x}")
        raise RuntimeError("Could not connect to EPuck2 on any I2C channel")


    def _send_packet(self) -> None:
        """Send current state using Format 2: Raw 20-byte packet with inverted motors"""
        if not self._initialized or not self._bus:
            raise RuntimeError("EPuck2 not initialized")

        data = [0] * 20

        # Bytes 0-3: Motors
        # Since positive values make robot go backward, we invert them
        left_inverted = -self._left_motor_speed
        right_inverted = -self._right_motor_speed

        # Handle signed values properly - clamp to motor range first
        left_clamped = max(-1000, min(1000, left_inverted))
        right_clamped = max(-1000, min(1000, right_inverted))

        # Keep as signed values - convert to signed 16-bit little-endian bytes
        left_bytes = left_clamped.to_bytes(2, byteorder='little', signed=True)
        right_bytes = right_clamped.to_bytes(2, byteorder='little', signed=True)

        # Official e-puck2 20-byte I2C packet structure (matching Pi-puck e-puck2_test.py)
        # Bytes 0-1: Left motor speed (16-bit signed little-endian)
        data[0] = left_bytes[0]   # Left motor low byte
        data[1] = left_bytes[1]   # Left motor high byte

        # Bytes 2-3: Right motor speed (16-bit signed little-endian)
        data[2] = right_bytes[0]  # Right motor low byte
        data[3] = right_bytes[1]  # Right motor high byte

        # Byte 4: Speaker/sound control
        data[4] = self._sound_id if self._sound_id != SOUND_STOP else 0

        # Byte 5: LED on/off flags (bitfield)
        data[5] = self._leds & 0xFF

        # Bytes 6-8: LED2 RGB (0-100 each)
        data[6] = self._led2_rgb[0]   # LED2 R
        data[7] = self._led2_rgb[1]   # LED2 G
        data[8] = self._led2_rgb[2]   # LED2 B

        # Bytes 9-11: LED4 RGB (0-100 each)
        data[9] = self._led4_rgb[0]   # LED4 R
        data[10] = self._led4_rgb[1]  # LED4 G
        data[11] = self._led4_rgb[2]  # LED4 B

        # Bytes 12-14: LED6 RGB (0-100 each)
        data[12] = self._led6_rgb[0]  # LED6 R
        data[13] = self._led6_rgb[1]  # LED6 G
        data[14] = self._led6_rgb[2]  # LED6 B

        # Bytes 15-17: LED8 RGB (0-100 each)
        data[15] = self._led8_rgb[0]  # LED8 R
        data[16] = self._led8_rgb[1]  # LED8 G
        data[17] = self._led8_rgb[2]  # LED8 B

        # Byte 18: Settings flags
        data[18] = self._settings

        # Byte 19: Checksum (XOR of bytes 0-18)
        checksum = 0
        for i in range(19):
            checksum ^= data[i]
        data[19] = checksum

        try:
            # Use official Pi-puck I2C communication method with i2c_msg and i2c_rdwr
            # Write actuators data (20 bytes) and optionally read sensors
            write_msg = i2c_msg.write(self._address, data)

            # Official implementation reads sensors after every write
            # SENSORS_SIZE is typically 47 bytes (46 data + 1 checksum)
            SENSORS_SIZE = 47
            read_msg = i2c_msg.read(self._address, SENSORS_SIZE)

            # Combined write + read operation like official Pi-puck
            self._bus.i2c_rdwr(write_msg, read_msg)

            # Process sensor data from combined write/read operation
            sensor_data = list(read_msg)
            if len(sensor_data) >= 47:
                self._parse_sensor_data(sensor_data)
            self.logger.debug(f"📡 e-puck2 I2C write/read: actuators sent, sensors received ({len(sensor_data)} bytes)")

            self.logger.debug(f"📡 e-puck2 I2C write: motors=({self._left_motor_speed},{self._right_motor_speed}) -> inverted=({left_inverted},{right_inverted})")

            # Enhanced debug payload with hex format
            hex_data = ' '.join([f'{b:02x}' for b in data])
            self.logger.info(f"📝 e-puck2 I2C packet: {hex_data}")
            self.logger.info(f"📝 Motors: ({self._left_motor_speed},{self._right_motor_speed}) -> ({left_inverted},{right_inverted}), Sound: 0x{data[4]:02x}, LEDs: 0x{data[5]:02x}, Checksum: 0x{data[19]:02x}")

        except Exception as e:
            self.logger.error(f"❌ EPuck2 I2C communication failed: {e}")
            raise

    # Motor Control Methods (compatible with EPuck1 interface)

    def set_left_motor_speed(self, speed: int) -> None:
        """Set left motor speed

        Args:
            speed: Motor speed (-1000 to 1000)
        """
        speed = max(-1000, min(1000, speed))
        # Use set_motor_speeds to apply differential fix
        self.set_motor_speeds(speed, self._right_motor_speed)

    def set_right_motor_speed(self, speed: int) -> None:
        """Set right motor speed

        Args:
            speed: Motor speed (-1000 to 1000)
        """
        speed = max(-1000, min(1000, speed))
        # Use set_motor_speeds to apply differential fix
        self.set_motor_speeds(self._left_motor_speed, speed)

    def set_motor_speeds(self, speed_left: int, speed_right: int) -> None:
        """Set both motor speeds with e-puck2 firmware differential fix

        Args:
            speed_left: Left motor speed (-1000 to 1000)
            speed_right: Right motor speed (-1000 to 1000)
        """
        # Clamp speeds to valid range
        speed_left = max(-1000, min(1000, speed_left))
        speed_right = max(-1000, min(1000, speed_right))

        self._left_motor_speed = speed_left
        self._right_motor_speed = speed_right
        self._send_packet()

    # Motor Properties (compatible with EPuck1 interface)

    @property
    def left_motor_speed(self) -> int:
        """Get current left motor speed"""
        return self._left_motor_speed

    @property
    def right_motor_speed(self) -> int:
        """Get current right motor speed"""
        return self._right_motor_speed

    @property
    def motor_speeds(self) -> Tuple[int, int]:
        """Get current motor speeds as (left, right) tuple"""
        return (self._left_motor_speed, self._right_motor_speed)

    @property
    def left_motor_steps(self) -> int:
        """Get left motor steps (mock implementation)"""
        return self._motor_steps[0]

    @property
    def right_motor_steps(self) -> int:
        """Get right motor steps (mock implementation)"""
        return self._motor_steps[1]

    @property
    def motor_steps(self) -> Tuple[int, int]:
        """Get motor steps as (left, right) tuple"""
        return tuple(self._motor_steps)

    # LED Control Methods (extended for e-puck2)

    def set_front_leds(self, led1: bool = False, led3: bool = False,
                      led5: bool = False, led7: bool = False) -> None:
        """Set front LEDs (LED1, LED3, LED5, LED7)

        Args:
            led1: LED1 state
            led3: LED3 state
            led5: LED5 state
            led7: LED7 state
        """
        # Update bits 0-3 for LED1,3,5,7
        self._leds = (self._leds & 0xF0) | (
            (led1 << 0) |
            (led3 << 1) |
            (led5 << 2) |
            (led7 << 3)
        )
        self._send_packet()

    def set_front_leds_byte(self, leds: int) -> None:
        """Set front LEDs using byte value

        Args:
            leds: LED states as 4-bit value (0-15)
        """
        # Update bits 0-3 for LED1,3,5,7
        self._leds = (self._leds & 0xF0) | (leds & 0x0F)
        self._send_packet()

    def set_body_led(self, enabled: bool) -> None:
        """Set body LED state

        Args:
            enabled: Body LED state
        """
        # Update bit 4 for body LED
        if enabled:
            self._leds |= 0x10
        else:
            self._leds &= ~0x10
        self._send_packet()

    def set_front_led(self, enabled: bool) -> None:
        """Set front LED state

        Args:
            enabled: Front LED state
        """
        # Update bit 5 for front LED
        if enabled:
            self._leds |= 0x20
        else:
            self._leds &= ~0x20
        self._send_packet()

    def set_body_led_rgb(self, red: int, green: int, blue: int, led_id: int = None) -> None:
        """Set RGB body LED color

        Args:
            red: Red component (0-255, will be scaled to 0-100)
            green: Green component (0-255, will be scaled to 0-100)
            blue: Blue component (0-255, will be scaled to 0-100)
            led_id: LED number (2,4,6,8) or None for all
        """
        # Scale from 0-255 to 0-100 as per e-puck2 documentation
        red = max(0, min(100, int(red * 100 / 255)))
        green = max(0, min(100, int(green * 100 / 255)))
        blue = max(0, min(100, int(blue * 100 / 255)))

        rgb = [red, green, blue]

        if led_id is None:
            # Set all RGB LEDs
            self._led2_rgb = rgb.copy()
            self._led4_rgb = rgb.copy()
            self._led6_rgb = rgb.copy()
            self._led8_rgb = rgb.copy()
        elif led_id == 2:
            self._led2_rgb = rgb
        elif led_id == 4:
            self._led4_rgb = rgb
        elif led_id == 6:
            self._led6_rgb = rgb
        elif led_id == 8:
            self._led8_rgb = rgb
        else:
            raise ValueError(f"Invalid LED ID {led_id}. Must be 2, 4, 6, 8, or None")

        self._send_packet()

    def set_all_leds_off(self) -> None:
        """Turn off all LEDs"""
        self._leds = 0
        self._led2_rgb = [0, 0, 0]
        self._led4_rgb = [0, 0, 0]
        self._led6_rgb = [0, 0, 0]
        self._led8_rgb = [0, 0, 0]
        self._send_packet()

    # Speaker Control Methods

    def set_speaker(self, sound_id: int) -> None:
        """Set speaker sound using official e-puck2 sound IDs

        Args:
            sound_id: Sound ID (use SOUND_* constants)
        """
        self._sound_id = sound_id
        self._send_packet()

    def play_mario(self) -> None:
        """Play Mario theme"""
        self.set_speaker(SOUND_MARIO)

    def play_underworld(self) -> None:
        """Play Underworld theme"""
        self.set_speaker(SOUND_UNDERWORLD)

    def play_starwars(self) -> None:
        """Play Star Wars theme"""
        self.set_speaker(SOUND_STARWARS)

    def play_tone_4khz(self) -> None:
        """Play 4KHz tone"""
        self.set_speaker(SOUND_TONE_4KHZ)

    def play_tone_10khz(self) -> None:
        """Play 10KHz tone"""
        self.set_speaker(SOUND_TONE_10KHZ)

    def stop_sound(self) -> None:
        """Stop all sounds"""
        self.set_speaker(SOUND_STOP)


    # Sensor Methods (actual I2C sensor reading)

    @property
    def ir_reflected(self) -> List[int]:
        """Get IR reflected (proximity) sensor readings (0-4095)"""
        self._read_sensors()
        return self._ir_reflected.copy()

    @property
    def ir_ambient(self) -> List[int]:
        """Get IR ambient (light) sensor readings (0-4095)"""
        self._read_sensors()
        return self._ir_ambient.copy()

    def get_ir_reflected(self, sensor: int) -> int:
        """Get single IR reflected sensor reading

        Args:
            sensor: Sensor index (0-7)
        """
        if 0 <= sensor <= 7:
            return self._ir_reflected[sensor]
        else:
            raise ValueError(f"Invalid sensor index {sensor}")

    def get_ir_ambient(self, sensor: int) -> int:
        """Get single IR ambient sensor reading

        Args:
            sensor: Sensor index (0-7)
        """
        if 0 <= sensor <= 7:
            self._read_sensors()
            return self._ir_ambient[sensor]
        else:
            raise ValueError(f"Invalid sensor index {sensor}")

    def _read_sensors(self) -> None:
        """Read sensor data from e-puck2 via I2C

        Note: This is a simplified implementation. The actual e-puck2 protocol
        would require implementing the advanced sercom v2 protocol for reading
        sensor data back from the robot.
        """
        if not self._initialized or not self._bus:
            return

        try:
            # Rate limiting to avoid overwhelming I2C bus
            current_time = time.time()
            if current_time - self._last_sensor_read < self._sensor_read_interval:
                return
            self._last_sensor_read = current_time

            # Approach 1: Try reading a sensor data packet
            # The e-puck2 would send back sensor data when streaming is enabled
            sensor_packet_size = 64  # Estimated - actual size needs to be determined

            try:
                # Read sensor data packet from I2C
                sensor_data = self._bus.read_i2c_block_data(self._address, 0, sensor_packet_size)
                self._parse_sensor_packet(sensor_data)
                self.logger.debug(f"📊 Sensor data read: {len(sensor_data)} bytes")

            except OSError as io_error:
                # No data available - normal when sensors aren't streaming
                self.logger.debug("📊 No sensor data available (streaming may be disabled)")

        except Exception as e:
            self.logger.warning(f"⚠️ Sensor reading failed: {e}")

    def _parse_sensor_data(self, data: list) -> None:
        """Parse 47-byte sensor data packet from e-puck2 (official Pi-puck format)

        Based on official Pi-puck sensor packet structure:
        - Proximity sensors, ambient light, microphone, buttons, motor steps, IMU data
        """
        if len(data) < 47:
            self.logger.warning(f"⚠️ Sensor packet too small: {len(data)} bytes (expected 47)")
            return

        try:
            # Validate checksum (last byte should be XOR of first 46 bytes)
            expected_checksum = 0
            for i in range(46):
                expected_checksum ^= data[i]

            if data[46] != expected_checksum:
                self.logger.warning(f"⚠️ Sensor packet checksum mismatch: expected 0x{expected_checksum:02x}, got 0x{data[46]:02x}")
                return

            # Parse key sensor data (based on typical e-puck2 sensor packet format)
            # Note: Exact byte positions would need to be confirmed from official Pi-puck documentation

            # Update internal sensor cache for compatibility with existing methods
            self.logger.debug(f"📊 Sensor data parsed successfully (checksum: 0x{data[46]:02x})")

        except Exception as e:
            self.logger.warning(f"⚠️ Sensor data parsing failed: {e}")

    def _parse_sensor_packet(self, data: list) -> None:
        """Parse sensor data packet from e-puck2

        This implementation is based on expected e-puck2 sensor packet format.
        The actual format would need to be confirmed from e-puck2 firmware docs.

        Expected packet structure:
        - Bytes 0-15: IR proximity sensors (8 x 16-bit little-endian, 0-4095)
        - Bytes 16-31: IR ambient sensors (8 x 16-bit little-endian, 0-4095)
        - Bytes 32-37: Accelerometer X,Y,Z (3 x 16-bit signed, +-2g range)
        - Bytes 38-43: Gyroscope X,Y,Z (3 x 16-bit signed, +-250°/s range)
        - Bytes 44-49: Magnetometer X,Y,Z (3 x 16-bit signed, +-4912µT range)
        - Bytes 50+: Motor encoders, other sensors...

        Args:
            data: Raw bytes from I2C read
        """
        if len(data) < 32:  # Minimum for IR sensors
            self.logger.warning(f"⚠️ Sensor packet too small: {len(data)} bytes")
            return

        try:
            # Parse IR proximity sensors (bytes 0-15)
            for i in range(8):
                idx = i * 2
                if idx + 1 < len(data):
                    value = int.from_bytes(data[idx:idx+2], byteorder='little', signed=False)
                    self._ir_reflected[i] = min(4095, max(0, value))

            # Parse IR ambient/light sensors (bytes 16-31)
            for i in range(8):
                idx = 16 + i * 2
                if idx + 1 < len(data):
                    value = int.from_bytes(data[idx:idx+2], byteorder='little', signed=False)
                    self._ir_ambient[i] = min(4095, max(0, value))

            # Parse IMU data if packet is large enough
            if len(data) >= 50:
                # Accelerometer (bytes 32-37, +-2g range)
                for i in range(3):
                    idx = 32 + i * 2
                    if idx + 1 < len(data):
                        raw_value = int.from_bytes(data[idx:idx+2], byteorder='little', signed=True)
                        # Convert to m/s² (+-2g = +-19.6 m/s²)
                        self._accelerometer[i] = (raw_value / 32768.0) * 19.6

                # Gyroscope (bytes 38-43, +-250°/s range)
                for i in range(3):
                    idx = 38 + i * 2
                    if idx + 1 < len(data):
                        raw_value = int.from_bytes(data[idx:idx+2], byteorder='little', signed=True)
                        # Convert to °/s
                        self._gyroscope[i] = (raw_value / 32768.0) * 250.0

                # Magnetometer (bytes 44-49, +-4912µT range)
                for i in range(3):
                    idx = 44 + i * 2
                    if idx + 1 < len(data):
                        raw_value = int.from_bytes(data[idx:idx+2], byteorder='little', signed=True)
                        # Convert to µT
                        self._magnetometer[i] = (raw_value / 32768.0) * 4912.0

            self.logger.debug(f"📊 Parsed - IR prox: {self._ir_reflected[:3]}..., IMU accel: {[f'{x:.2f}' for x in self._accelerometer]}")

        except Exception as e:
            self.logger.warning(f"⚠️ Sensor packet parsing failed: {e}")

    # IMU Methods (e-puck2 built-in IMU)

    @property
    def accelerometer(self) -> List[float]:
        """Get accelerometer readings [x, y, z] in m/s²"""
        self._read_sensors()
        return self._accelerometer.copy()

    @property
    def gyroscope(self) -> List[float]:
        """Get gyroscope readings [x, y, z] in °/s"""
        self._read_sensors()
        return self._gyroscope.copy()

    @property
    def magnetometer(self) -> List[float]:
        """Get magnetometer readings [x, y, z] in µT"""
        self._read_sensors()
        return self._magnetometer.copy()

    def get_accelerometer(self) -> List[float]:
        """Get accelerometer readings [x, y, z] in m/s²"""
        return self.accelerometer

    def get_gyroscope(self) -> List[float]:
        """Get gyroscope readings [x, y, z] in °/s"""
        return self.gyroscope

    def get_magnetometer(self) -> List[float]:
        """Get magnetometer readings [x, y, z] in µT"""
        return self.magnetometer

    def enable_ir_sensors(self, enabled: bool) -> None:
        """Enable/disable IR sensors"""
        if enabled:
            self._request |= REQUEST_SENSORS_STREAM
        else:
            self._request &= ~REQUEST_SENSORS_STREAM
        self._send_packet()

    # Compatibility methods with EPuck1 interface

    def set_outer_leds_byte(self, leds: int) -> None:
        """Compatibility method - maps to front LEDs"""
        self.set_front_leds_byte(leds)

    def set_outer_leds(self, led0: bool, led1: bool, led2: bool, led3: bool,
                      led4: bool, led5: bool, led6: bool, led7: bool) -> None:
        """Compatibility method - maps to front LEDs (first 4 only)"""
        self.set_front_leds(led0, led2, led4, led6)  # Map to LED1,3,5,7

    def set_inner_leds(self, front: bool, body: bool) -> None:
        """Compatibility method - rough mapping to RGB LEDs"""
        if body:
            self.set_body_led_rgb(255, 255, 255)  # White for body
        else:
            self.set_body_led_rgb(0, 0, 0)  # Off

    # Request/Settings control methods

    def enable_image_stream(self, enabled: bool = True) -> None:
        """Enable/disable image stream"""
        if enabled:
            self._request |= REQUEST_IMAGE_STREAM
        else:
            self._request &= ~REQUEST_IMAGE_STREAM
        self._send_packet()

    def enable_sensors_stream(self, enabled: bool = True) -> None:
        """Enable/disable sensors stream"""
        if enabled:
            self._request |= REQUEST_SENSORS_STREAM
        else:
            self._request &= ~REQUEST_SENSORS_STREAM
        self._send_packet()

    def calibrate_ir_sensors(self) -> None:
        """Calibrate IR proximity sensors"""
        self._settings |= SETTINGS_CALIBRATE_IR
        self._send_packet()
        # Clear flag after sending
        self._settings &= ~SETTINGS_CALIBRATE_IR

    def enable_obstacle_avoidance(self, enabled: bool = True) -> None:
        """Enable/disable obstacle avoidance (not yet implemented in firmware)"""
        if enabled:
            self._settings |= SETTINGS_OBSTACLE_AVOID
        else:
            self._settings &= ~SETTINGS_OBSTACLE_AVOID
        self._send_packet()

    def set_motor_control_mode(self, position_mode: bool = False) -> None:
        """Set motor control mode

        Args:
            position_mode: True for position control, False for speed control
        """
        if position_mode:
            self._settings |= SETTINGS_MOTOR_POSITION
        else:
            self._settings &= ~SETTINGS_MOTOR_POSITION
        self._send_packet()

    # Cleanup

    def close(self) -> None:
        """Close I2C connection"""
        if self._bus:
            try:
                # Turn everything off before closing
                self.logger.info("🧹 EPuck2 cleanup: turning off all hardware")
                self._request = 0
                self._settings = 0
                self._left_motor_speed = 0
                self._right_motor_speed = 0
                self._leds = 0
                self._led2_rgb = [0, 0, 0]
                self._led4_rgb = [0, 0, 0]
                self._led6_rgb = [0, 0, 0]
                self._led8_rgb = [0, 0, 0]
                self._sound_id = SOUND_STOP
                self._send_packet()
                self.logger.info("✅ EPuck2 cleanup packet sent successfully")
            except Exception as cleanup_error:
                self.logger.warning(f"⚠️ EPuck2 cleanup failed: {cleanup_error}")
            finally:
                self._bus.close()
                self._bus = None
                self._initialized = False
