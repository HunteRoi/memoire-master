"""E-puck2 robot interface using 20-byte I2C packet format"""

import logging
import time
from typing import List, Tuple, Optional

try:
    import smbus2
except ImportError:
    smbus2 = None

I2C_CHANNEL = 12
LEGACY_I2C_CHANNEL = 4

# Common I2C addresses for e-puck/pi-puck debugging
COMMON_EPUCK_ADDRESSES = [0x1f, 0x1e, 0x20, 0x08, 0x0a]

# Official e-puck2 Sound IDs
SOUND_MARIO = 1
SOUND_UNDERWORLD = 2
SOUND_STARWARS = 4
SOUND_TONE_4KHZ = 8
SOUND_TONE_10KHZ = 16
SOUND_STOP = 32

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
    - Byte 0: request flag
    - Byte 1: settings flag
    - Bytes 2-3: Left motor speed/position (signed 16-bit little-endian)
    - Bytes 4-5: Right motor speed/position (signed 16-bit little-endian)
    - Byte 6: LEDs (LED1,3,5,7,Body,Front bits)
    - Bytes 7-9: LED2 RGB (R,G,B, 0-100 each)
    - Bytes 10-12: LED4 RGB (R,G,B, 0-100 each)
    - Bytes 13-15: LED6 RGB (R,G,B, 0-100 each)
    - Bytes 16-18: LED8 RGB (R,G,B, 0-100 each)
    - Byte 19: Sound ID (0x01=MARIO, 0x02=UNDERWORLD, 0x04=STARWARS, 0x08=4KHz, 0x10=10KHz, 0x20=stop)
    """

    def __init__(self, i2c_bus: Optional[int] = None, i2c_address: Optional[int] = None):
        """Initialize EPuck2 interface

        Args:
            i2c_bus: I2C bus number (None = auto-detect from [12, 4])
            i2c_address: I2C address of e-puck2 (default 0x1f)
        """
        self.logger = logging.getLogger(__name__)
        self._address = i2c_address if i2c_address is not None else COMMON_EPUCK_ADDRESSES[0]
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
        """Initialize I2C connection"""
        if not smbus2:
            raise ImportError("smbus2 library not available")

        for channel in self._I2C_CHANNELS:
            try:
                self._bus = smbus2.SMBus(channel)
                # Test communication - try different approaches
                try:
                    # Method 1: Try reading a byte
                    test_byte = self._bus.read_byte(self._address)
                    self.logger.info(f"✅ EPuck2 I2C communication test successful on channel {channel} (read byte: 0x{test_byte:02x})")
                except OSError as read_error:
                    # Method 2: If read fails, try a write test instead
                    try:
                        self._bus.write_byte(self._address, 0)
                        self.logger.info(f"✅ EPuck2 I2C write test successful on channel {channel} (read failed: {read_error})")
                    except Exception as write_error:
                        raise Exception(f"Both I2C read and write tests failed: read={read_error}, write={write_error}")

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

    def test_packet_formats(self) -> bool:
        """Test different packet formats to find what works"""
        if not self._initialized or not self._bus:
            self.logger.error("❌ EPuck2 not initialized for packet format test")
            return False

        try:
            import time
            self.logger.info("🔍 Testing different packet formats to find working one...")
            self.logger.info("⏱️ Watch carefully - each test will run for 3 seconds with delays")

            self.logger.info("\n" + "="*30)
            self.logger.info("📝 Format 1: 0x80 command + motors in bytes 2-5")
            self.logger.info("="*30)
            test_data_1 = [0] * 20
            test_data_1[2] = 200  # Left motor low byte
            test_data_1[3] = 0    # Left motor high byte  
            test_data_1[4] = 200  # Right motor low byte
            test_data_1[5] = 0    # Right motor high byte
            
            try:
                hex_data = ' '.join([f'{b:02x}' for b in test_data_1])
                self.logger.info(f"📤 Sending: 0x80 {hex_data}")
                self._bus.write_i2c_block_data(self._address, 0x80, test_data_1)
                self.logger.info("⏱️ Running for 3 seconds...")
                time.sleep(3)
                
                # Stop
                stop_data = [0] * 20
                self._bus.write_i2c_block_data(self._address, 0x80, stop_data)
                self.logger.info("🛑 Stopped")
                time.sleep(2)  # Longer delay between tests
            except Exception as e:
                self.logger.error(f"❌ Format 1 failed: {e}")

            self.logger.info("\n" + "="*30)
            self.logger.info("📝 Format 2: Raw 20-byte packet (no command ID)")
            self.logger.info("="*30)
            test_data_2 = [0] * 20
            test_data_2[0] = 200  # Left motor low byte
            test_data_2[1] = 0    # Left motor high byte
            test_data_2[2] = 200  # Right motor low byte  
            test_data_2[3] = 0    # Right motor high byte
            
            try:
                hex_data = ' '.join([f'{b:02x}' for b in test_data_2])
                self.logger.info(f"📤 Sending: {hex_data}")
                self._bus.write_i2c_block_data(self._address, 0, test_data_2)
                self.logger.info("⏱️ Running for 3 seconds...")
                time.sleep(3)
                
                # Stop
                stop_data = [0] * 20
                self._bus.write_i2c_block_data(self._address, 0, stop_data)
                self.logger.info("🛑 Stopped")
                time.sleep(2)  # Longer delay between tests
            except Exception as e:
                self.logger.error(f"❌ Format 2 failed: {e}")

            self.logger.info("\n" + "="*30)
            self.logger.info("📝 Format 3: 21-byte block (0x80 + data together)")
            self.logger.info("="*30)
            test_data_3 = [0x80] + ([0] * 20)
            test_data_3[3] = 200  # Left motor low byte (byte 2 in data)
            test_data_3[4] = 0    # Left motor high byte
            test_data_3[5] = 200  # Right motor low byte (byte 4 in data)
            test_data_3[6] = 0    # Right motor high byte
            
            try:
                hex_data = ' '.join([f'{b:02x}' for b in test_data_3])
                self.logger.info(f"📤 Sending: {hex_data}")
                self._bus.write_block_data(self._address, 0, test_data_3)
                self.logger.info("⏱️ Running for 3 seconds...")
                time.sleep(3)
                
                # Stop
                stop_data = [0x80] + ([0] * 20)
                self._bus.write_block_data(self._address, 0, stop_data)
                self.logger.info("🛑 Stopped")
                time.sleep(2)  # Longer delay between tests
            except Exception as e:
                self.logger.error(f"❌ Format 3 failed: {e}")

            self.logger.info("\n" + "="*30)
            self.logger.info("📝 Format 4: 0x80 + motors in bytes 1-4")
            self.logger.info("="*30)
            test_data_4 = [0] * 20
            test_data_4[1] = 200  # Left motor low byte (byte 1)
            test_data_4[2] = 0    # Left motor high byte
            test_data_4[3] = 200  # Right motor low byte (byte 3)
            test_data_4[4] = 0    # Right motor high byte
            
            try:
                hex_data = ' '.join([f'{b:02x}' for b in test_data_4])
                self.logger.info(f"📤 Sending: 0x80 {hex_data}")
                self._bus.write_i2c_block_data(self._address, 0x80, test_data_4)
                self.logger.info("⏱️ Running for 3 seconds...")
                time.sleep(3)
                
                # Stop
                stop_data = [0] * 20
                self._bus.write_i2c_block_data(self._address, 0x80, stop_data)
                self.logger.info("🛑 Stopped")
                time.sleep(2)  # Longer delay between tests
            except Exception as e:
                self.logger.error(f"❌ Format 4 failed: {e}")

            self.logger.info("\n" + "="*50)
            self.logger.info("🔍 WHICH FORMAT MADE THE ROBOT MOVE?")
            self.logger.info("="*50)
            return True

        except Exception as e:
            self.logger.error(f"❌ Packet format test failed: {e}")
            return False

    def _send_packet(self) -> None:
        """Send current state using Format 2: Raw 20-byte packet with inverted motors"""
        if not self._initialized or not self._bus:
            raise RuntimeError("EPuck2 not initialized")

        # Create 20-byte data payload (Format 2 - CONFIRMED WORKING!)
        data = [0] * 20

        # Bytes 0-3: Motors - EXACT FORMAT 2 STRUCTURE (CONFIRMED WORKING!)
        # Working test: c8 00 c8 00 = (200,0,200,0) for both motors forward
        # Since positive values make robot go backward, we invert them
        left_inverted = -self._left_motor_speed
        right_inverted = -self._right_motor_speed
        
        # Match exact working test structure: simple byte values
        data[0] = abs(left_inverted) & 0xFF   # Left motor low byte
        data[1] = 0                           # Left motor high byte (always 0 for speeds <= 255)
        data[2] = abs(right_inverted) & 0xFF  # Right motor low byte  
        data[3] = 0                           # Right motor high byte (always 0 for speeds <= 255)

        # Bytes 4-19: Keep simple like working test (mostly zeros except for actual features)
        # Only set non-zero values for active features
        
        # Sound (test had byte 4 = 0, so only set if we want sound)
        data[4] = self._sound_id if self._sound_id != SOUND_STOP else 0

        # LEDs (test had byte 5 = 0, so only set if LEDs are on)  
        data[5] = self._leds

        # RGB LEDs (test had all zeros, so only set if RGB is active)
        if any(self._led2_rgb) or any(self._led4_rgb) or any(self._led6_rgb) or any(self._led8_rgb):
            data[6] = self._led2_rgb[0]   # LED2 R
            data[7] = self._led2_rgb[1]   # LED2 G
            data[8] = self._led2_rgb[2]   # LED2 B
            data[9] = self._led4_rgb[0]   # LED4 R
            data[10] = self._led4_rgb[1]  # LED4 G
            data[11] = self._led4_rgb[2]  # LED4 B
            data[12] = self._led6_rgb[0]  # LED6 R
            data[13] = self._led6_rgb[1]  # LED6 G
            data[14] = self._led6_rgb[2]  # LED6 B
            data[15] = self._led8_rgb[0]  # LED8 R
            data[16] = self._led8_rgb[1]  # LED8 G
            data[17] = self._led8_rgb[2]  # LED8 B

        # Remaining bytes stay 0 like the working test
        # data[18] and data[19] remain 0

        # Send raw 20-byte packet using Format 2 (no command ID)
        try:
            self._bus.write_i2c_block_data(self._address, 0, data)
            self.logger.debug(f"📡 Format 2 packet sent: motors=({self._left_motor_speed},{self._right_motor_speed}) -> inverted=({left_inverted},{right_inverted})")

            # Enhanced debug payload with hex format
            hex_data = ' '.join([f'{b:02x}' for b in data])
            self.logger.info(f"📝 Format 2 packet: {hex_data}")
            self.logger.info(f"📝 Motors: ({self._left_motor_speed},{self._right_motor_speed}) -> ({left_inverted},{right_inverted}), Sound: 0x{data[4]:02x}, LEDs: 0x{data[5]:02x}")

        except Exception as e:
            self.logger.error(f"❌ EPuck2 I2C send failed: {e}")
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

    def test_sound_patterns(self) -> bool:
        """Test different sound command patterns to debug audio issues"""
        try:
            self.logger.info("🎵 Testing comprehensive sound patterns...")

            import time

            # Test all defined sound IDs
            sound_tests = [
                (SOUND_MARIO, "Mario theme", 5),
                (SOUND_UNDERWORLD, "Underworld theme", 5),
                (SOUND_STARWARS, "Star Wars theme", 5),
                (SOUND_TONE_4KHZ, "4KHz tone", 5),
                (SOUND_TONE_10KHZ, "10KHz tone", 5)
            ]

            for sound_id, name, duration in sound_tests:
                self.logger.info(f"🎵 Testing {name} (ID: 0x{sound_id:02x})")
                self.set_speaker(sound_id)
                time.sleep(duration)
                self.set_speaker(SOUND_STOP)
                time.sleep(0.5)

            # Stop all sounds
            self.set_speaker(SOUND_STOP)
            self._send_packet()

            self.logger.info("✅ Sound pattern test completed")
            return True

        except Exception as e:
            self.logger.error(f"❌ Sound pattern test failed: {e}")
            return False

    def test_pipuck_leds(self) -> bool:
        """Test Pi-puck LED integration using PiPuck object"""
        try:
            self.logger.info("💡 Testing Pi-puck LED integration...")

            # Try to import and create PiPuck object for LED testing
            try:
                from pipuck.pipuck import PiPuck
                import time

                self.logger.info("🔧 Creating temporary PiPuck object for LED testing...")
                pipuck = PiPuck()

                self.logger.info("✅ PiPuck object created for LED testing")

                # Test Pi-puck RGB LEDs using PiPuck object methods
                colors_to_test = [
                    ('red', (True, False, False), "🔴"),
                    ('green', (False, True, False), "🟢"),
                    ('blue', (False, False, True), "🔵"),
                    ('white', (True, True, True), "⚪")
                ]

                for color_name, rgb_values, emoji in colors_to_test:
                    self.logger.info(f"{emoji} Testing Pi-puck {color_name.upper()} LEDs...")
                    pipuck.set_leds_rgb(*rgb_values)
                    time.sleep(1)

                # Turn off all LEDs
                self.logger.info("⚫ Turning off Pi-puck LEDs...")
                pipuck.set_leds_rgb(False, False, False)
                time.sleep(0.5)

                self.logger.info("✅ Pi-puck LED test completed using PiPuck object")

                # Clean up PiPuck object
                pipuck.close()
                return True

            except ImportError:
                self.logger.warning("⚠️ PiPuck library not available - install pipuck package")
                return False
            except Exception as pipuck_error:
                self.logger.warning(f"⚠️ Pi-puck LED test failed: {pipuck_error}")
                return False

        except Exception as e:
            self.logger.error(f"❌ Pi-puck LED test failed: {e}")
            return False

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
