"""EPuck hardware interface"""

from abc import ABC, abstractmethod
from typing import List, Tuple

class EPuckInterface(ABC):
    """Interface for e-puck robot control and sensors access, with methods implemented for compatibility with pipuck library."""

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the hardware component"""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Cleanup the hardware component"""
        pass

#################################################
#           EPUCK2 SPECIFIC METHODS             #
#################################################

    @abstractmethod
    def go_forward(self, speed: int) -> None:
        """Set both motors to move forward at the specified speed."""
        pass

    @abstractmethod
    def go_backward(self, speed: int) -> None:
        """Set both motors to move backward at the specified speed."""
        pass

    @abstractmethod
    def turn_left(self, speed: int) -> None:
        """Set motors to turn left at the specified speed."""
        pass

    @abstractmethod
    def turn_right(self, speed: int) -> None:
        """Set motors to turn right at the specified speed."""
        pass

    @abstractmethod
    def stop_motor(self) -> None:
        """Set motors to no speed."""
        pass

    @abstractmethod
    def set_motor_control_mode(self, position_mode: bool) -> None:
        """Set motor control mode: True for position mode, False for speed mode."""
        pass

    @abstractmethod
    def toggle_obstacle_avoidance(self) -> None:
        """Toggle the obstacle avoidance feature."""
        pass

    @abstractmethod
    def enable_front_leds(self) -> None:
        """Enable the front LEDs."""
        pass

    @abstractmethod
    def disable_front_leds(self) -> None:
        """Disable the front LEDs."""
        pass

    @abstractmethod
    def enable_body_leds(self) -> None:
        """Enable the body LEDs."""
        pass

    @abstractmethod
    def disable_body_leds(self) -> None:
        """Disable the body LEDs."""
        pass

    @abstractmethod
    def set_body_led_rgb(self, red: int, green: int, blue: int, led: int = None) -> None:
        """Set the RGB color of the body LED. If led is None, set all body LEDs."""
        pass

    @abstractmethod
    def play_sound(self, sound_id: int) -> None:
        """Play a predefined sound on the e-puck2."""
        pass

    @abstractmethod
    def stop_sound(self) -> None:
        """Stop any currently playing sound."""
        pass

    @abstractmethod
    def play_mario(self) -> None:
        """Play the Mario theme."""
        pass

    @abstractmethod
    def play_underworld(self) -> None:
        """Play the Underworld theme."""
        pass

    @abstractmethod
    def play_starwars(self) -> None:
        """Play the Star Wars theme."""
        pass

    @abstractmethod
    def play_tone_4khz(self) -> None:
        """Play a 4kHz tone."""
        pass

    @abstractmethod
    def play_tone_10khz(self) -> None:
        """Play a 10kHz tone."""
        pass

    @abstractmethod
    def calibrate_ir_sensors(self) -> None:
        """Calibrate the IR sensors."""
        pass

    @abstractmethod
    def read_proximity_sensors(self) -> List[int]:
        """Read and return the proximity sensor values."""
        pass

    @abstractmethod
    def read_ambient_light_sensors(self) -> List[int]:
        """Read and return the ambient light sensor values."""
        pass

    @abstractmethod
    def take_picture_with_front_camera(self) -> None:
        """Capture a snapshot with the front camera"""
        pass

    @abstractmethod
    def take_picture_with_omnivision_camera(self) -> None:
        """Capture a snapshot with the 360° camera (OmniVision3 module)"""
        pass

    @abstractmethod
    def read_microphone_sensors(self) -> List[int]:
        """Read and return the microphone sensor values"""
        pass

    @abstractmethod
    def get_accelerometer(self) -> Tuple[float, float, float]:
        """Get accelerometer readings (x, y, z)."""
        pass

    @property
    @abstractmethod
    def accelerometer(self) -> Tuple[float, float, float]:
        """Get accelerometer readings (x, y, z)."""
        pass

    @abstractmethod
    def get_gyroscope(self) -> Tuple[float, float, float]:
        """Get gyroscope readings (x, y, z)."""
        pass

    @property
    @abstractmethod
    def gyroscope(self) -> Tuple[float, float, float]:
        """Get gyroscope readings (x, y, z)."""
        pass

    @abstractmethod
    def get_magnetometer(self) -> Tuple[float, float, float]:
        """Get magnetometer readings (x, y, z)."""
        pass

    @property
    @abstractmethod
    def magnetometer(self) -> Tuple[float, float, float]:
        """Get magnetometer readings (x, y, z)."""
        pass

    @abstractmethod
    def get_ground_sensors(self) -> List[int]:
        """Get ground sensor values [left, center, right]."""
        pass

    @property
    @abstractmethod
    def ground_sensors(self) -> List[int]:
        """Get all ground sensor values [left, center, right]."""
        pass

#################################################
#           EPUCK1 SPECIFIC METHODS             #
#################################################

    @abstractmethod
    def set_outer_leds_byte(self, leds):
        pass

    @abstractmethod
    def set_outer_leds(self, led0, led1, led2, led3, led4, led5, led6, led7):
        pass

    @abstractmethod
    def set_inner_leds(self, front, body):
        pass

    @abstractmethod
    def set_left_motor_speed(self, speed):
        pass

    @abstractmethod
    def set_right_motor_speed(self, speed):
        pass

    @abstractmethod
    def set_motor_speeds(self, speed_left, speed_right):
        pass

    @property
    @abstractmethod
    def left_motor_speed(self):
        pass

    @property
    @abstractmethod
    def right_motor_speed(self):
        pass

    @property
    @abstractmethod
    def motor_speeds(self):
        pass

    @property
    @abstractmethod
    def left_motor_steps(self):
        pass

    @property
    @abstractmethod
    def right_motor_steps(self):
        pass

    @property
    @abstractmethod
    def motor_steps(self):
        pass

    @abstractmethod
    def enable_ir_sensors(self, enabled):
        pass

    @abstractmethod
    def get_ir_reflected(self, sensor):
        pass

    @property
    @abstractmethod
    def ir_reflected(self):
        pass

    @abstractmethod
    def get_ir_ambient(self, sensor):
        pass

    @property
    @abstractmethod
    def ir_ambient(self):
        pass

#################################################
#            EPUCK SPECIFIC METHODS             #
#################################################

    @staticmethod
    @abstractmethod
    def reset_robot():
        pass
