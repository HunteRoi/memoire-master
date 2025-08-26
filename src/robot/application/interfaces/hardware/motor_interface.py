"""Motor hardware interface"""

from abc import ABC, abstractmethod


class MotorInterface(ABC):
    """Interface for motor control"""

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the hardware component"""
        pass

    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup the hardware component"""
        pass

    @abstractmethod
    async def set_speed(self, left_speed: float, right_speed: float) -> None:
        """Set motor speeds (-1000 to 1000)"""
        pass

    @abstractmethod
    async def stop(self) -> None:
        """Stop both motors"""
        pass
