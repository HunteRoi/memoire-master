"""
ActuatorsData Builder for EPuck2 Robot
=====================================

A builder pattern implementation for constructing 20-byte EPuck2 actuator command packets.
Provides a fluent interface with meaningful method names for controlling robot behavior.

Usage Example:
    actuator_packet = (ActuatorsData()
        .WithSound(SOUND.MARIO)
        .WithFrontLeds()
        .WithBodyLeds(255, 255, 0)  # Yellow body LEDs
        .MoveForward(500)
        .Build())
"""

from enum import IntEnum
from typing import Optional


class SOUND(IntEnum):
    """Sound constants for EPuck2 speaker control."""
    MARIO = 0x01
    UNDERWORLD = 0x02
    STARWARS = 0x04
    TONE_4KHZ = 0x08
    TONE_10KHZ = 0x10
    STOP = 0x20


class LED(IntEnum):
    """LED position constants for EPuck2 body LEDs."""
    LED2 = 2
    LED4 = 4
    LED6 = 6
    LED8 = 8


# Byte positions in the 20-byte actuator command packet
_LEFT_MOTOR_LOW_BYTE = 0
_LEFT_MOTOR_HIGH_BYTE = 1
_RIGHT_MOTOR_LOW_BYTE = 2
_RIGHT_MOTOR_HIGH_BYTE = 3
_SPEAKER_BYTE = 4
_FRONT_LED_BYTE = 5
_LED2_RED_BYTE = 6
_LED2_GREEN_BYTE = 7
_LED2_BLUE_BYTE = 8
_LED4_RED_BYTE = 9
_LED4_GREEN_BYTE = 10
_LED4_BLUE_BYTE = 11
_LED6_RED_BYTE = 12
_LED6_GREEN_BYTE = 13
_LED6_BLUE_BYTE = 14
_LED8_RED_BYTE = 15
_LED8_GREEN_BYTE = 16
_LED8_BLUE_BYTE = 17
_SETTINGS_BYTE = 18
_CHECKSUM_BYTE = 19

_ACTUATORS_SIZE = 20

# LED bitfield masks for front LEDs (byte 5)
_FRONT_LED_MASK = 0x01
_LED1_MASK = 0x02
_LED3_MASK = 0x04
_LED5_MASK = 0x08
_LED7_MASK = 0x10


class ActuatorsData:
    """
    Builder for EPuck2 actuator command packets using the builder pattern.

    Constructs a 20-byte packet with proper checksums for controlling:
    - Motors (forward/backward movement, turning)
    - Speaker (sound effects and tones)
    - LEDs (front LEDs and RGB body LEDs)
    - Settings (motor control mode, sensor calibration)
    """

    def __init__(self):
        """Initialize a new ActuatorsData builder with all actuators disabled."""
        self._data = bytearray(_ACTUATORS_SIZE)
        self._reset()

    def _reset(self) -> None:
        """Reset all actuator data to safe defaults."""
        # Initialize all bytes to zero
        for i in range(_ACTUATORS_SIZE):
            self._data[i] = 0

    def _calculate_checksum(self) -> int:
        """Calculate XOR checksum for the actuator data packet."""
        checksum = 0
        for i in range(_ACTUATORS_SIZE - 1):  # Exclude checksum byte itself
            checksum ^= self._data[i]
        return checksum

    def _set_motor_speeds(self, left_speed: int, right_speed: int) -> 'ActuatorsData':
        """
        Set motor speeds using signed 16-bit little-endian format.

        Args:
            left_speed: Left motor speed (-1000 to +1000)
            right_speed: Right motor speed (-1000 to +1000)
        """
        # Clamp speeds to valid range
        left_speed = max(-1000, min(1000, left_speed))
        right_speed = max(-1000, min(1000, right_speed))

        # Convert to signed 16-bit little-endian bytes
        left_bytes = left_speed.to_bytes(2, byteorder='little', signed=True)
        right_bytes = right_speed.to_bytes(2, byteorder='little', signed=True)

        self._data[_LEFT_MOTOR_LOW_BYTE] = left_bytes[0]
        self._data[_LEFT_MOTOR_HIGH_BYTE] = left_bytes[1]
        self._data[_RIGHT_MOTOR_LOW_BYTE] = right_bytes[0]
        self._data[_RIGHT_MOTOR_HIGH_BYTE] = right_bytes[1]

        return self

    def _set_led_rgb(self, led_position: LED, red: int, green: int, blue: int) -> 'ActuatorsData':
        """
        Set RGB values for a specific body LED.

        Args:
            led_position: LED position (LED.LED2, LED.LED4, LED.LED6, LED.LED8)
            red: Red component (0-255)
            green: Green component (0-255)
            blue: Blue component (0-255)
        """
        # Clamp RGB values to valid range for EPuck2 LEDs (0-100)
        red = max(0, min(100, red))
        green = max(0, min(100, green))
        blue = max(0, min(100, blue))

        # Map LED position to byte offsets
        led_byte_map = {
            LED.LED2: (_LED2_RED_BYTE, _LED2_GREEN_BYTE, _LED2_BLUE_BYTE),
            LED.LED4: (_LED4_RED_BYTE, _LED4_GREEN_BYTE, _LED4_BLUE_BYTE),
            LED.LED6: (_LED6_RED_BYTE, _LED6_GREEN_BYTE, _LED6_BLUE_BYTE),
            LED.LED8: (_LED8_RED_BYTE, _LED8_GREEN_BYTE, _LED8_BLUE_BYTE),
        }

        if led_position in led_byte_map:
            red_byte, green_byte, blue_byte = led_byte_map[led_position]
            self._data[red_byte] = red
            self._data[green_byte] = green
            self._data[blue_byte] = blue

        return self

    # =============================================================================
    # SOUND METHODS
    # =============================================================================

    def WithSound(self, sound: SOUND) -> 'ActuatorsData':
        """
        Set the robot speaker to play a specific sound.

        Args:
            sound: Sound to play (use SOUND enum values)

        Returns:
            Self for method chaining

        Example:
            .WithSound(SOUND.MARIO)
        """
        self._data[_SPEAKER_BYTE] = sound.value
        return self

    def InSilence(self) -> 'ActuatorsData':
        """
        Stop any currently playing sound.

        Returns:
            Self for method chaining
        """
        return self.WithSound(SOUND.STOP)

    # =============================================================================
    # LED METHODS
    # =============================================================================

    def WithFrontLeds(self, enabled: bool = True) -> 'ActuatorsData':
        """
        Enable or disable the front LEDs.

        Args:
            enabled: True to turn on front LEDs, False to turn off

        Returns:
            Self for method chaining
        """
        if enabled:
            self._data[_FRONT_LED_BYTE] |= _FRONT_LED_MASK
        else:
            self._data[_FRONT_LED_BYTE] &= ~_FRONT_LED_MASK
        return self

    def WithoutFrontLeds(self) -> 'ActuatorsData':
        """
        Disable the front LEDs.

        Returns:
            Self for method chaining
        """
        return self.WithFrontLeds(False)

    def WithBodyLeds(self, red: int, green: int, blue: int, led: Optional[LED] = None) -> 'ActuatorsData':
        """
        Set RGB color for body LEDs.

        Args:
            red: Red component (0-255)
            green: Green component (0-255)
            blue: Blue component (0-255)
            led: Specific LED to control (None = all body LEDs)

        Returns:
            Self for method chaining

        Example:
            .WithBodyLeds(255, 255, 0)  # Yellow all body LEDs
            .WithBodyLeds(255, 0, 0, LED.LED2)  # Red LED2 only
        """
        if led is None:
            # Set all body LEDs
            for body_led in [LED.LED2, LED.LED4, LED.LED6, LED.LED8]:
                self._set_led_rgb(body_led, red, green, blue)
        else:
            self._set_led_rgb(led, red, green, blue)
        return self

    def WithRedBodyLeds(self, led: Optional[LED] = None) -> 'ActuatorsData':
        """Set body LEDs to red color."""
        return self.WithBodyLeds(255, 0, 0, led)

    def WithGreenBodyLeds(self, led: Optional[LED] = None) -> 'ActuatorsData':
        """Set body LEDs to green color."""
        return self.WithBodyLeds(0, 255, 0, led)

    def WithBlueBodyLeds(self, led: Optional[LED] = None) -> 'ActuatorsData':
        """Set body LEDs to blue color."""
        return self.WithBodyLeds(0, 0, 255, led)

    def WithYellowBodyLeds(self, led: Optional[LED] = None) -> 'ActuatorsData':
        """Set body LEDs to yellow color."""
        return self.WithBodyLeds(255, 255, 0, led)

    def WithWhiteBodyLeds(self, led: Optional[LED] = None) -> 'ActuatorsData':
        """Set body LEDs to white color."""
        return self.WithBodyLeds(255, 255, 255, led)

    def WithoutBodyLeds(self, led: Optional[LED] = None) -> 'ActuatorsData':
        """
        Turn off body LEDs.

        Args:
            led: Specific LED to turn off (None = all body LEDs)

        Returns:
            Self for method chaining
        """
        return self.WithBodyLeds(0, 0, 0, led)

    # =============================================================================
    # MOTOR MOVEMENT METHODS
    # =============================================================================

    def MoveForward(self, speed: int) -> 'ActuatorsData':
        """
        Move robot forward at specified speed.

        Args:
            speed: Movement speed (0-1000)

        Returns:
            Self for method chaining
        """
        speed = max(0, min(1000, speed))
        return self._set_motor_speeds(speed, speed)

    def MoveBackward(self, speed: int) -> 'ActuatorsData':
        """
        Move robot backward at specified speed.

        Args:
            speed: Movement speed (0-1000)

        Returns:
            Self for method chaining
        """
        speed = max(0, min(1000, speed))
        return self._set_motor_speeds(-speed, -speed)

    def TurnLeft(self, speed: int) -> 'ActuatorsData':
        """
        Turn robot left at specified speed.

        Args:
            speed: Turn speed (0-1000)

        Returns:
            Self for method chaining
        """
        speed = max(0, min(1000, speed))
        return self._set_motor_speeds(-speed, speed)

    def TurnRight(self, speed: int) -> 'ActuatorsData':
        """
        Turn robot right at specified speed.

        Args:
            speed: Turn speed (0-1000)

        Returns:
            Self for method chaining
        """
        speed = max(0, min(1000, speed))
        return self._set_motor_speeds(speed, -speed)

    def Stop(self) -> 'ActuatorsData':
        """
        Stop all motor movement.

        Returns:
            Self for method chaining
        """
        return self._set_motor_speeds(0, 0)

    def WithMotorSpeeds(self, left_speed: int, right_speed: int) -> 'ActuatorsData':
        """
        Set individual motor speeds for advanced control.

        Args:
            left_speed: Left motor speed (-1000 to +1000)
            right_speed: Right motor speed (-1000 to +1000)

        Returns:
            Self for method chaining
        """
        return self._set_motor_speeds(left_speed, right_speed)

    # =============================================================================
    # SETTINGS METHODS
    # =============================================================================

    def WithPositionMode(self, enabled: bool = True) -> 'ActuatorsData':
        """
        Enable or disable motor position control mode.

        Args:
            enabled: True for position mode, False for speed mode

        Returns:
            Self for method chaining
        """
        if enabled:
            self._data[_SETTINGS_BYTE] |= 0x10  # SETTINGS_MOTOR_POSITION
        else:
            self._data[_SETTINGS_BYTE] &= ~0x10
        return self

    def WithSpeedMode(self) -> 'ActuatorsData':
        """
        Set motor control to speed mode.

        Returns:
            Self for method chaining
        """
        return self.WithPositionMode(False)

    def WithObstacleAvoidance(self, enabled: bool = True) -> 'ActuatorsData':
        """
        Enable or disable obstacle avoidance.

        Args:
            enabled: True to enable obstacle avoidance

        Returns:
            Self for method chaining
        """
        if enabled:
            self._data[_SETTINGS_BYTE] |= 0x08  # SETTINGS_OBSTACLE_AVOID
        else:
            self._data[_SETTINGS_BYTE] &= ~0x08
        return self

    def WithSensorCalibration(self, enabled: bool = True) -> 'ActuatorsData':
        """
        Enable or disable IR sensor calibration.

        Args:
            enabled: True to trigger sensor calibration

        Returns:
            Self for method chaining
        """
        if enabled:
            self._data[_SETTINGS_BYTE] |= 0x04  # SETTINGS_CALIBRATE_IR
        else:
            self._data[_SETTINGS_BYTE] &= ~0x04
        return self

    # =============================================================================
    # BUILD METHOD
    # =============================================================================

    def Build(self) -> bytearray:
        """
        Build and return the final 20-byte actuator command packet.

        Calculates the checksum and returns a complete packet ready for I2C transmission.

        Returns:
            20-byte actuator command packet with proper checksum

        Example:
            packet = (ActuatorsData()
                .WithSound(SOUND.MARIO)
                .MoveForward(500)
                .WithFrontLeds()
                .Build())
        """
        # Calculate and set checksum
        self._data[_CHECKSUM_BYTE] = self._calculate_checksum()

        # Return a copy of the data to prevent external modification
        return bytearray(self._data)

    def Reset(self) -> 'ActuatorsData':
        """
        Reset all actuator settings to safe defaults.

        Returns:
            Self for method chaining
        """
        self._reset()
        return self

    def __repr__(self) -> str:
        """String representation of the current actuator data."""
        hex_data = ' '.join([f'{b:02x}' for b in self._data])
        return f"ActuatorsData(data=[{hex_data}])"
