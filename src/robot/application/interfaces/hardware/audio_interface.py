"""Audio hardware interface"""

from abc import ABC, abstractmethod


class AudioInterface(ABC):
    """Interface for audio playback"""

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the hardware component"""
        pass

    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup the hardware component"""
        pass

    @abstractmethod
    async def play_beep(self, duration: float = 0.1) -> None:
        """Play a simple beep"""
        pass

    @abstractmethod
    async def play_melody(self, melody_name: str = "mario") -> None:
        """Play a melody from a string representation"""
        pass

    @abstractmethod
    async def stop_audio(self) -> None:
        """Stop any currently playing audio"""
        pass
