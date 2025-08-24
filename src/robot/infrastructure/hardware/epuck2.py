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

        self.logger.info(f"🤖 EPuck2 initializing with I2C address: 0x{self._address:02x}")

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

    def test_i2c_communication(self) -> bool:
        """Test I2C communication with diagnostic information"""
        if not self._initialized or not self._bus:
            self.logger.error("❌ EPuck2 not initialized for I2C test")
            return False

        try:
            # Test 1: Simple ping
            self.logger.info("🔍 Testing I2C communication...")

            # Test 2: Send a minimal packet
            test_packet = [0] * 20  # All zeros
            self._bus.write_i2c_block_data(self._address, 0, test_packet)
            self.logger.info("✅ I2C write test successful")

            # Test 3: Comprehensive motor movement test
            self.logger.info("🔍 Testing motor movement patterns...")

            import time

            # Test Forward - try slight differential to see if it works
            self.logger.info("➡️ Testing FORWARD (slight differential)")
            self.set_motor_speeds(500, 480)  # Slightly different speeds
            time.sleep(1)
            self.set_motor_speeds(0, 0)
            time.sleep(0.5)

            # Test Forward - exact same speeds
            self.logger.info("➡️ Testing FORWARD (exact same speeds)")
            self.set_motor_speeds(500, 500)
            time.sleep(1)
            self.set_motor_speeds(0, 0)
            time.sleep(0.5)

            # Test Backward - slight differential
            self.logger.info("⬅️ Testing BACKWARD (slight differential)")
            self.set_motor_speeds(-500, -480)
            time.sleep(1)
            self.set_motor_speeds(0, 0)
            time.sleep(0.5)

            # Test Backward - exact same speeds
            self.logger.info("⬅️ Testing BACKWARD (exact same speeds)")
            self.set_motor_speeds(-500, -500)
            time.sleep(1)
            self.set_motor_speeds(0, 0)
            time.sleep(0.5)

            # Test Left Turn
            self.logger.info("🔄 Testing LEFT TURN (left slower/negative, right positive)")
            self.set_motor_speeds(-300, 300)
            time.sleep(1)
            self.set_motor_speeds(0, 0)
            time.sleep(0.5)

            # Test Right Turn
            self.logger.info("🔄 Testing RIGHT TURN (left positive, right slower/negative)")
            self.set_motor_speeds(300, -300)
            time.sleep(1)
            self.set_motor_speeds(0, 0)

            self.logger.info("✅ Comprehensive motor movement test completed")

            return True

        except Exception as e:
            self.logger.error(f"❌ I2C communication test failed: {e}")
            return False

    def _send_packet(self) -> None:
        """Send current state as 20-byte I2C packet using original working format"""
        if not self._initialized or not self._bus:
            raise RuntimeError("EPuck2 not initialized")

        # Create 20-byte payload
        payload = [0] * 20

        # Motors (bytes 0-3): signed 16-bit little-endian - ORIGINAL WORKING POSITIONS
        left_bytes = self._left_motor_speed.to_bytes(2, byteorder='little', signed=True)
        right_bytes = self._right_motor_speed.to_bytes(2, byteorder='little', signed=True)

        payload[0] = left_bytes[0]   # Left motor low byte
        payload[1] = left_bytes[1]   # Left motor high byte
        payload[2] = right_bytes[0]  # Right motor low byte
        payload[3] = right_bytes[1]  # Right motor high byte

        # Speaker (byte 4) - ORIGINAL WORKING POSITION
        payload[4] = self._sound_id

        # LEDs (byte 5) - LED1,3,5,7,Body,Front bits
        payload[5] = self._leds_byte

        # RGB LEDs (bytes 6-17) - using 0-255 range like original
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

        # Settings (byte 18) - ORIGINAL POSITION  
        payload[18] = self._request_settings

        # Checksum (byte 19) - ORIGINAL WORKING IMPLEMENTATION
        checksum = 0
        for i in range(19):
            checksum ^= payload[i]
        payload[19] = checksum

        # Send packet
        try:
            # Try different I2C write methods to ensure compatibility
            # Method 1: write_i2c_block_data (standard approach)
            try:
                self._bus.write_i2c_block_data(self._address, 0, payload)
                self.logger.debug(f"📡 EPuck2 packet sent via write_i2c_block_data: motors=({self._left_motor_speed},{self._right_motor_speed}), sound_id=0x{self._sound_id:02x}")
            except Exception as e1:
                # Method 2: Try writing without register (direct block write)
                try:
                    # Some devices expect direct block write without register
                    self._bus.write_block_data(self._address, 0, payload)
                    self.logger.warning(f"⚠️ Fallback to write_block_data successful: {e1}")
                except Exception as e2:
                    # Method 3: Write individual bytes
                    for i, byte_val in enumerate(payload):
                        self._bus.write_byte_data(self._address, i, byte_val)
                    self.logger.warning(f"⚠️ Fallback to individual byte writes: {e2}")

            # Enhanced debug payload with hex format
            hex_payload = ' '.join([f'{b:02x}' for b in payload])
            self.logger.info(f"📝 Full packet (hex): {hex_payload}")
            self.logger.info(f"📝 Packet details: motors=({self._left_motor_speed},{self._right_motor_speed}) @bytes0-3, sound=0x{payload[4]:02x} @byte4, leds=0x{payload[5]:02x} @byte5, checksum=0x{payload[19]:02x}")

        except Exception as e:
            self.logger.error(f"❌ EPuck2 I2C send failed: {e}")
            self.logger.error(f"❌ I2C address: 0x{self._address:02x}, Bus: {self._bus}")
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

        # Fix for e-puck2 firmware limitation: forward/backward need slight differential
        # e-puck2 firmware only responds to differential motor commands!
        if speed_left == speed_right and speed_left != 0:
            if speed_left > 0:  # Forward movement
                speed_right = int(speed_right * 0.98)  # Make right slightly slower
                self.logger.info(f"🔧 Applied forward differential: left={speed_left}, right={speed_right}")
            else:  # Backward movement
                speed_right = int(speed_right * 0.98)  # Make right slightly less negative
                self.logger.info(f"🔧 Applied backward differential: left={speed_left}, right={speed_right}")

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

    def test_audio(self) -> bool:
        """Test audio functionality"""
        try:
            self.logger.info("🎵 Testing audio functionality...")

            # Test 1: Play Mario theme
            self.logger.info("🎵 Playing Mario theme...")
            self.play_mario()

            import time
            time.sleep(2)

            # Test 2: Stop sound
            self.logger.info("🔇 Stopping sound...")
            self.stop_sound()

            time.sleep(0.5)

            # Test 3: Play 4KHz tone
            self.logger.info("🔊 Playing 4KHz tone...")
            self.play_tone_4khz()

            time.sleep(1)

            # Test 4: Stop
            self.stop_sound()

            self.logger.info("✅ Audio test completed")
            return True

        except Exception as e:
            self.logger.error(f"❌ Audio test failed: {e}")
            return False

    def test_sound_patterns(self) -> bool:
        """Test different sound command patterns to debug audio issues"""
        try:
            self.logger.info("🎵 Testing comprehensive sound patterns...")

            import time

            # Test all defined sound IDs
            sound_tests = [
                (SOUND_MARIO, "Mario theme", 3),
                (SOUND_UNDERWORLD, "Underworld theme", 3),
                (SOUND_STARWARS, "Star Wars theme", 3),
                (SOUND_TONE_4KHZ, "4KHz tone", 2),
                (SOUND_TONE_10KHZ, "10KHz tone", 2)
            ]

            for sound_id, name, duration in sound_tests:
                self.logger.info(f"🎵 Testing {name} (ID: 0x{sound_id:02x})")
                self.set_speaker(sound_id)
                time.sleep(duration)
                self.set_speaker(SOUND_STOP)
                time.sleep(0.5)

            # Test raw sound values directly
            self.logger.info("🎵 Testing raw sound values...")
            raw_sounds = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x00]
            for raw_sound in raw_sounds:
                self.logger.info(f"🎵 Raw sound test: 0x{raw_sound:02x}")
                self._sound_id = raw_sound
                self._send_packet()
                time.sleep(1.5)

            # Stop all sounds
            self._sound_id = 0x00
            self._send_packet()

            self.logger.info("✅ Sound pattern test completed")
            return True

        except Exception as e:
            self.logger.error(f"❌ Sound pattern test failed: {e}")
            return False

    def test_alternate_sound_positions(self) -> bool:
        """Test sound commands in different byte positions to debug protocol"""
        try:
            self.logger.info("🎵 Testing alternate sound byte positions...")

            import time

            # Test sound in different positions
            positions_to_test = [
                ("Byte 19 (current position)", 19),
                ("Byte 4 (alternate position)", 4),
                ("Byte 18 (reserved position)", 18),
                ("Byte 0 (settings position)", 0)
            ]

            for desc, pos in positions_to_test:
                self.logger.info(f"🎵 Testing {desc}...")

                # Create manual packet with sound in different position
                payload = [0] * 20
                payload[pos] = 0x01  # Mario sound

                # Send manual packet
                try:
                    self._bus.write_i2c_block_data(self._address, 0, payload)
                    hex_payload = ' '.join([f'{b:02x}' for b in payload])
                    self.logger.info(f"📝 Test packet: {hex_payload}")
                    time.sleep(2)

                    # Clear packet
                    payload[pos] = 0x00
                    self._bus.write_i2c_block_data(self._address, 0, payload)
                    time.sleep(0.5)

                except Exception as e:
                    self.logger.error(f"❌ Failed to send test packet: {e}")

            self.logger.info("✅ Alternate sound position test completed")
            return True

        except Exception as e:
            self.logger.error(f"❌ Alternate sound position test failed: {e}")
            return False

    def test_audio_hardware_check(self) -> bool:
        """Check if audio hardware responds to any commands"""
        try:
            self.logger.info("🎵 Testing if audio hardware is responsive...")

            import time

            # Test 1: Try enabling audio in settings byte
            self.logger.info("🎵 Testing with settings byte modifications...")

            # Try different request/settings combinations with audio
            settings_tests = [
                (0x00, "Default settings"),
                (0x01, "Image stream enabled"),
                (0x02, "Sensor stream enabled"),
                (0x04, "IR calibration"),
                (0x08, "Audio enable attempt")
            ]

            for setting, desc in settings_tests:
                self.logger.info(f"🎵 {desc} + Mario sound")

                # Create packet with specific settings and sound
                payload = [0] * 20
                payload[0] = setting     # Settings byte
                payload[19] = 0x01       # Mario sound

                self._bus.write_i2c_block_data(self._address, 0, payload)
                time.sleep(1.5)

                # Clear
                payload[19] = 0x00
                self._bus.write_i2c_block_data(self._address, 0, payload)
                time.sleep(0.5)

            # Test 2: Try maximum volume/intensity
            self.logger.info("🎵 Testing combined sound commands...")

            # Try combining multiple sound bits
            combined_sounds = [0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F]
            for sound_combo in combined_sounds:
                self.logger.info(f"🎵 Combined sound bits: 0x{sound_combo:02x}")
                self._sound_id = sound_combo
                self._send_packet()
                time.sleep(1)

            # Clear all sounds
            self._sound_id = 0x00
            self._send_packet()

            self.logger.info("✅ Audio hardware check completed")
            return True

        except Exception as e:
            self.logger.error(f"❌ Audio hardware check failed: {e}")
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

    def scan_i2c_addresses(self) -> None:
        """Scan for I2C devices to help debug connectivity issues"""
        if not self._bus:
            self.logger.error("❌ No I2C bus available for scanning")
            return

        self.logger.info("🔍 Scanning I2C addresses...")
        found_devices = []

        for address in range(0x08, 0x78):  # Valid I2C address range
            try:
                self._bus.read_byte(address)
                found_devices.append(address)
                self.logger.info(f"✅ Found I2C device at address: 0x{address:02x}")
            except:
                pass  # No device at this address

        if found_devices:
            self.logger.info(f"🔍 Found {len(found_devices)} I2C devices: {[f'0x{addr:02x}' for addr in found_devices]}")
            if self._address not in found_devices:
                self.logger.warning(f"⚠️ Current address 0x{self._address:02x} not found in scan!")
        else:
            self.logger.warning("⚠️ No I2C devices found in scan")

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
                self._left_motor_speed = 0
                self._right_motor_speed = 0
                self._sound_id = 0
                self._leds_byte = 0
                self._led2_rgb = [0, 0, 0]
                self._led4_rgb = [0, 0, 0]
                self._led6_rgb = [0, 0, 0]
                self._led8_rgb = [0, 0, 0]
                self._send_packet()
                self.logger.info("✅ EPuck2 cleanup packet sent successfully")
            except Exception as cleanup_error:
                self.logger.warning(f"⚠️ EPuck2 cleanup failed: {cleanup_error}")
            finally:
                self._bus.close()
                self._bus = None
                self._initialized = False
