"""LED hardware interface"""

from abc import ABC, abstractmethod


class LEDInterface(ABC):
    """Interface for LED control"""

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the hardware component"""
        pass

    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup the hardware component"""
        pass

    @abstractmethod
    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set body LED RGB values (0-255)"""
        pass

    @abstractmethod
    async def set_front_led(self, enabled: bool) -> None:
        """Enable/disable front LED"""
        pass
