"""E-puck2 audio implementation using unifr-api-epuck"""

import asyncio
import logging
from typing import Optional
from pi_puck import PiPuck
from ..domain.interfaces import AudioInterface
from ..domain.entities import AudioCommand


class EPuck2Audio(AudioInterface):
    """E-puck2 audio playback implementation"""
    
    def __init__(self):
        self.pi_puck: Optional[PiPuck] = None
        self.logger = logging.getLogger(__name__)
        self._initialized = False
    
    async def initialize(self) -> bool:
        """Initialize audio hardware"""
        try:
            self.pi_puck = PiPuck()
            await asyncio.to_thread(self.pi_puck.init_audio)
            self._initialized = True
            self.logger.info("🔊 E-puck2 audio initialized")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize audio: {e}")
            return False
    
    async def cleanup(self) -> None:
        """Cleanup audio hardware"""
        if self.pi_puck and self._initialized:
            try:
                await asyncio.to_thread(self.pi_puck.cleanup_audio)
                self.logger.info("🧹 Audio cleaned up")
            except Exception as e:
                self.logger.error(f"❌ Error during audio cleanup: {e}")
            finally:
                self._initialized = False
    
    async def play_tone(self, frequency: int, duration: float, volume: float = 1.0) -> None:
        """Play a tone"""
        if not self._initialized:
            raise RuntimeError("Audio not initialized")
        
        # Clamp values to valid ranges
        frequency = max(20, min(20000, frequency))  # Human hearing range
        volume = max(0.0, min(1.0, volume))
        duration = max(0.01, duration)  # Minimum 10ms
        
        try:
            await asyncio.to_thread(
                self.pi_puck.play_tone,
                frequency,
                int(duration * 1000),  # Convert to milliseconds
                int(volume * 100)  # Convert to percentage
            )
            self.logger.debug(f"🔊 Played tone: {frequency}Hz for {duration}s")
        except Exception as e:
            self.logger.error(f"❌ Failed to play tone: {e}")
            raise
    
    async def play_beep(self, duration: float = 0.1) -> None:
        """Play a simple beep"""
        await self.play_tone(1000, duration, 0.5)  # 1kHz beep
    
    async def play_error_sound(self) -> None:
        """Play error sound sequence"""
        try:
            # Play descending error tones
            error_tones = [800, 600, 400]
            for frequency in error_tones:
                await self.play_tone(frequency, 0.2, 0.7)
                await asyncio.sleep(0.05)  # Short pause between tones
        except Exception as e:
            self.logger.error(f"❌ Failed to play error sound: {e}")
    
    async def execute_command(self, command: AudioCommand) -> None:
        """Execute an audio command"""
        try:
            if command.sound_type == "beep":
                await self.play_beep(command.duration)
            elif command.sound_type == "error":
                await self.play_error_sound()
            else:  # Default to tone
                if command.frequency is not None:
                    await self.play_tone(command.frequency, command.duration, command.volume)
                else:
                    await self.play_beep(command.duration)
        except Exception as e:
            self.logger.error(f"❌ Failed to execute audio command: {e}")
            raise