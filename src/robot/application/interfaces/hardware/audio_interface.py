"""Audio hardware interface"""

from abc import ABC, abstractmethod
from domain.entities import AudioCommand


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
    async def play_tone(self, frequency: int, duration: float, volume: float = 1.0) -> None:
        """Play a tone"""
        pass
    
    @abstractmethod
    async def play_beep(self, duration: float = 0.1) -> None:
        """Play a simple beep"""
        pass
    
    @abstractmethod
    async def execute_command(self, command: AudioCommand) -> None:
        """Execute an audio command"""
        pass