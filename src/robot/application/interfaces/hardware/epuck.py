"""EPuck hardware interface"""

from abc import ABC, abstractmethod

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
