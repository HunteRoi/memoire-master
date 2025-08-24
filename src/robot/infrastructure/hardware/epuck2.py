"""E-puck2 robot interface using 20-byte I2C packet format"""

import logging
from typing import List, Tuple, Optional

try:
    import smbus2
except ImportError:
    smbus2 = None

I2C_CHANNEL = 12
LEGACY_I2C_CHANNEL = 4

# Official e-puck2 Sound IDs
SOUND_OFF = 0x00
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

    Packet format (20 bytes) per official e-puck2 documentation:
    - Byte 0: Request/Settings flags
    - Bytes 1-2: Left motor speed/position (signed 16-bit little-endian)
    - Bytes 3-4: Right motor speed/position (signed 16-bit little-endian)
    - Byte 5: LEDs (LED1,3,5,7,Body,Front bits)
    - Bytes 6-8: LED2 RGB (R,G,B, 0-100 each)
    - Bytes 9-11: LED4 RGB (R,G,B, 0-100 each)
    - Bytes 12-14: LED6 RGB (R,G,B, 0-100 each)
    - Bytes 15-17: LED8 RGB (R,G,B, 0-100 each)
    - Byte 18: Reserved
    - Byte 19: Sound ID (0x01=MARIO, 0x02=UNDERWORLD, 0x04=STARWARS, 0x08=4KHz, 0x10=10KHz, 0x20=stop)
    """

    def __init__(self, i2c_bus: Optional[int] = None, i2c_address: Optional[int] = None):
        """Initialize EPuck2 interface

        Args:
            i2c_bus: I2C bus number (None = auto-detect from [12, 4])
            i2c_address: I2C address of e-puck2 (default 0x1f)
        """
        self.logger = logging.getLogger(__name__)
        self._address = i2c_address if i2c_address is not None else 0x1f
        self._bus = None
        self._initialized = False

        # I2C configuration
        self._I2C_CHANNELS = [I2C_CHANNEL, LEGACY_I2C_CHANNEL] if i2c_bus is None else [i2c_bus]

        # Current state tracking
        self._left_motor_speed = 0
        self._right_motor_speed = 0
        self._sound_id = 0
        self._leds_byte = 0  # LED1,3,5,7,Body,Front bits
        self._led2_rgb = [0, 0, 0]  # 0-100 range
        self._led4_rgb = [0, 0, 0]  # 0-100 range
        self._led6_rgb = [0, 0, 0]  # 0-100 range
        self._led8_rgb = [0, 0, 0]  # 0-100 range
        self._request_settings = 0  # Request/Settings byte

        # Sensor readings cache
        self._ir_reflected = [0] * 8  # Proximity sensors (0-4095)
        self._ir_ambient = [0] * 8    # Light sensors (0-4095)
        self._motor_steps = [0, 0]    # Motor encoder steps
        self._accelerometer = [0.0, 0.0, 9.8]  # [x, y, z] in m/s²
        self._gyroscope = [0.0, 0.0, 0.0]      # [x, y, z] in °/s
        self._magnetometer = [0.0, 0.0, 0.0]   # [x, y, z] in µT

        # Initialize I2C connection
        self._connect()

    def __del__(self):
        """Destructor - cleanup when object is garbage collected"""
        self.close()

    def _connect(self) -> None:
        """Initialize I2C connection"""
        if not smbus2:
            raise ImportError("smbus2 library not available")

        for channel in self._I2C_CHANNELS:
            try:
                self._bus = smbus2.SMBus(channel)
                # Test communication
                self._bus.read_byte(self._address)
                self.logger.info(f"✅ EPuck2 connected on I2C channel {channel}")
                self._initialized = True
                # Send initial safe packet
                self._send_packet()
                return
            except Exception as e:
                if self._bus:
                    self._bus.close()
                    self._bus = None
                self.logger.debug(f"I2C channel {channel} failed: {e}")

        raise RuntimeError("Could not connect to EPuck2 on any I2C channel")

    def _send_packet(self) -> None:
        """Send current state as 20-byte I2C packet per official e-puck2 format"""
        if not self._initialized or not self._bus:
            raise RuntimeError("EPuck2 not initialized")

        # Create 20-byte payload
        payload = [0] * 20

        # Request/Settings (byte 0)
        payload[0] = self._request_settings

        # Motors (bytes 1-4): signed 16-bit little-endian
        left_bytes = self._left_motor_speed.to_bytes(2, byteorder='little', signed=True)
        right_bytes = self._right_motor_speed.to_bytes(2, byteorder='little', signed=True)

        payload[1] = left_bytes[0]   # Left motor low byte
        payload[2] = left_bytes[1]   # Left motor high byte
        payload[3] = right_bytes[0]  # Right motor low byte
        payload[4] = right_bytes[1]  # Right motor high byte

        # LEDs (byte 5) - LED1,3,5,7,Body,Front bits
        payload[5] = self._leds_byte

        # RGB LEDs (bytes 6-17) - values 0-100
        payload[6] = self._led2_rgb[0]   # LED2 R
        payload[7] = self._led2_rgb[1]   # LED2 G
        payload[8] = self._led2_rgb[2]   # LED2 B
        payload[9] = self._led4_rgb[0]   # LED4 R
        payload[10] = self._led4_rgb[1]  # LED4 G
        payload[11] = self._led4_rgb[2]  # LED4 B
        payload[12] = self._led6_rgb[0]  # LED6 R
        payload[13] = self._led6_rgb[1]  # LED6 G
        payload[14] = self._led6_rgb[2]  # LED6 B
        payload[15] = self._led8_rgb[0]  # LED8 R
        payload[16] = self._led8_rgb[1]  # LED8 G
        payload[17] = self._led8_rgb[2]  # LED8 B

        # Reserved (byte 18)
        payload[18] = 0

        # Sound ID (byte 19)
        payload[19] = self._sound_id

        # Send packet
        try:
            self._bus.write_i2c_block_data(self._address, 0, payload)
            self.logger.debug(f"📡 EPuck2 packet sent: motors=({self._left_motor_speed},{self._right_motor_speed}), sound_id=0x{self._sound_id:02x}")

            # Debug payload bytes
            self.logger.debug(f"📝 Full packet: {payload}")

        except Exception as e:
            self.logger.error(f"❌ EPuck2 I2C send failed: {e}")
            raise

    # Motor Control Methods (compatible with EPuck1 interface)

    def set_left_motor_speed(self, speed: int) -> None:
        """Set left motor speed

        Args:
            speed: Motor speed (-1000 to 1000)
        """
        self._left_motor_speed = max(-1000, min(1000, speed))
        self._send_packet()

    def set_right_motor_speed(self, speed: int) -> None:
        """Set right motor speed

        Args:
            speed: Motor speed (-1000 to 1000)
        """
        self._right_motor_speed = max(-1000, min(1000, speed))
        self._send_packet()

    def set_motor_speeds(self, speed_left: int, speed_right: int) -> None:
        """Set both motor speeds

        Args:
            speed_left: Left motor speed (-1000 to 1000)
            speed_right: Right motor speed (-1000 to 1000)
        """
        self._left_motor_speed = max(-1000, min(1000, speed_left))
        self._right_motor_speed = max(-1000, min(1000, speed_right))
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
        self._leds_byte = (self._leds_byte & 0xF0) | (
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
        self._leds_byte = (self._leds_byte & 0xF0) | (leds & 0x0F)
        self._send_packet()

    def set_body_led(self, enabled: bool) -> None:
        """Set body LED state

        Args:
            enabled: Body LED state
        """
        # Update bit 4 for body LED
        if enabled:
            self._leds_byte |= 0x10
        else:
            self._leds_byte &= ~0x10
        self._send_packet()

    def set_front_led(self, enabled: bool) -> None:
        """Set front LED state

        Args:
            enabled: Front LED state
        """
        # Update bit 5 for front LED
        if enabled:
            self._leds_byte |= 0x20
        else:
            self._leds_byte &= ~0x20
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
        self._leds_byte = 0
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
        self._sound_id = sound_id & 0x3F  # Limit to valid range
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
            # TODO: Implement actual sensor reading protocol
            # For now, this is a placeholder that would need the proper
            # e-puck2 sensor reading protocol implementation

            # The e-puck2 would need to send back sensor data when streaming is enabled
            # This would typically involve:
            # 1. Reading multiple bytes of sensor data from I2C
            # 2. Parsing the data according to e-puck2 protocol
            # 3. Updating the sensor value arrays

            self.logger.debug("📊 Sensor reading not yet implemented - using mock data")

        except Exception as e:
            self.logger.warning(f"⚠️ Sensor reading failed: {e}")

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
            self._request_settings |= REQUEST_SENSORS_STREAM
        else:
            self._request_settings &= ~REQUEST_SENSORS_STREAM
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
            self._request_settings |= REQUEST_IMAGE_STREAM
        else:
            self._request_settings &= ~REQUEST_IMAGE_STREAM
        self._send_packet()

    def enable_sensors_stream(self, enabled: bool = True) -> None:
        """Enable/disable sensors stream"""
        if enabled:
            self._request_settings |= REQUEST_SENSORS_STREAM
        else:
            self._request_settings &= ~REQUEST_SENSORS_STREAM
        self._send_packet()

    def calibrate_ir_sensors(self) -> None:
        """Calibrate IR proximity sensors"""
        self._request_settings |= SETTINGS_CALIBRATE_IR
        self._send_packet()
        # Clear flag after sending
        self._request_settings &= ~SETTINGS_CALIBRATE_IR

    def enable_obstacle_avoidance(self, enabled: bool = True) -> None:
        """Enable/disable obstacle avoidance (not yet implemented in firmware)"""
        if enabled:
            self._request_settings |= SETTINGS_OBSTACLE_AVOID
        else:
            self._request_settings &= ~SETTINGS_OBSTACLE_AVOID
        self._send_packet()

    def set_motor_control_mode(self, position_mode: bool = False) -> None:
        """Set motor control mode

        Args:
            position_mode: True for position control, False for speed control
        """
        if position_mode:
            self._request_settings |= SETTINGS_MOTOR_POSITION
        else:
            self._request_settings &= ~SETTINGS_MOTOR_POSITION
        self._send_packet()

    # Cleanup

    def close(self) -> None:
        """Close I2C connection"""
        if self._bus:
            try:
                # Turn everything off before closing
                self._left_motor_speed = 0
                self._right_motor_speed = 0
                self._sound_id = 0
                self._leds_byte = 0
                self._led2_rgb = [0, 0, 0]
                self._led4_rgb = [0, 0, 0]
                self._led6_rgb = [0, 0, 0]
                self._led8_rgb = [0, 0, 0]
                self._send_packet()
            except:
                pass  # Ignore errors during cleanup
            finally:
                self._bus.close()
                self._bus = None
                self._initialized = False
