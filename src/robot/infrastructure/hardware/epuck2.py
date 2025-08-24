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


class EPuck2:
    """E-puck2 robot control using Pi-puck 20-byte I2C packet format

    Compatible with EPuck1 interface but uses the correct 20-byte protocol
    for e-puck2 robots as documented in Pi-puck specification.

    Packet format (20 bytes):
    - Bytes 0-1: Left motor speed (signed 16-bit little-endian)
    - Bytes 2-3: Right motor speed (signed 16-bit little-endian)
    - Byte 4: Speaker sound ID (0=off, 1=beep, 2=mario)
    - Byte 5: LED1,3,5,7 (4 bits)
    - Bytes 6-8: LED2 RGB (R,G,B)
    - Bytes 9-11: LED4 RGB (R,G,B)
    - Bytes 12-14: LED6 RGB (R,G,B)
    - Bytes 15-17: LED8 RGB (R,G,B)
    - Byte 18: Settings
    - Byte 19: Checksum (XOR of bytes 0-18)
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
        self._speaker_id = 0
        self._front_leds = 0
        self._led2_rgb = [0, 0, 0]
        self._led4_rgb = [0, 0, 0]
        self._led6_rgb = [0, 0, 0]
        self._led8_rgb = [0, 0, 0]
        self._settings = 0

        # Last sensor readings (mock for now - would need sensor read implementation)
        self._ir_reflected = [0] * 8
        self._ir_ambient = [0] * 8
        self._motor_steps = [0, 0]

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
        """Send current state as 20-byte I2C packet"""
        if not self._initialized or not self._bus:
            raise RuntimeError("EPuck2 not initialized")

        # Create 20-byte payload
        payload = [0] * 20

        # Motors (bytes 0-3): signed 16-bit little-endian
        left_bytes = self._left_motor_speed.to_bytes(2, byteorder='little', signed=True)
        right_bytes = self._right_motor_speed.to_bytes(2, byteorder='little', signed=True)

        payload[0] = left_bytes[0]   # Left motor low byte
        payload[1] = left_bytes[1]   # Left motor high byte
        payload[2] = right_bytes[0]  # Right motor low byte
        payload[3] = right_bytes[1]  # Right motor high byte

        # Speaker (byte 4)
        payload[4] = self._speaker_id

        # Front LEDs (byte 5)
        payload[5] = self._front_leds

        # RGB LEDs (bytes 6-17)
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

        # Settings (byte 18)
        payload[18] = self._settings

        # Checksum (byte 19)
        checksum = 0
        for i in range(19):
            checksum ^= payload[i]
        payload[19] = checksum

        # Send packet
        try:
            self._bus.write_i2c_block_data(self._address, 0, payload)
            self.logger.debug(f"📡 EPuck2 packet sent: motors=({self._left_motor_speed},{self._right_motor_speed}), speaker={self._speaker_id}")

            # EXTRA DEBUGGING for Mario theme bug
            if self._speaker_id != 0:
                self.logger.warning(f"🚨 NON-ZERO SPEAKER in packet! speaker={self._speaker_id}")

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
        self._front_leds = (
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
        self._front_leds = leds & 0x0F
        self._send_packet()

    def set_body_led_rgb(self, red: int, green: int, blue: int, led_id: int = None) -> None:
        """Set RGB body LED color

        Args:
            red: Red component (0-255)
            green: Green component (0-255)
            blue: Blue component (0-255)
            led_id: LED number (2,4,6,8) or None for all
        """
        red = max(0, min(255, red))
        green = max(0, min(255, green))
        blue = max(0, min(255, blue))

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
        self._front_leds = 0
        self._led2_rgb = [0, 0, 0]
        self._led4_rgb = [0, 0, 0]
        self._led6_rgb = [0, 0, 0]
        self._led8_rgb = [0, 0, 0]
        self._send_packet()

    # Speaker Control Methods

    def set_speaker(self, sound_id: int) -> None:
        """Set speaker sound

        Args:
            sound_id: Sound ID (0=off, 1=beep, 2=mario)
        """
        self._speaker_id = max(0, min(2, sound_id))
        self._send_packet()

    # Sensor Methods (mock implementation - would need actual sensor reading)

    @property
    def ir_reflected(self) -> List[int]:
        """Get IR reflected sensor readings (mock)"""
        return self._ir_reflected.copy()

    @property
    def ir_ambient(self) -> List[int]:
        """Get IR ambient sensor readings (mock)"""
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
            return self._ir_ambient[sensor]
        else:
            raise ValueError(f"Invalid sensor index {sensor}")

    def enable_ir_sensors(self, enabled: bool) -> None:
        """Enable/disable IR sensors (mock implementation)"""
        pass  # Would need actual implementation

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

    # Cleanup

    def close(self) -> None:
        """Close I2C connection"""
        if self._bus:
            try:
                # Turn everything off before closing
                self._left_motor_speed = 0
                self._right_motor_speed = 0
                self._speaker_id = 0
                self._front_leds = 0
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
