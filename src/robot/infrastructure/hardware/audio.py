"""Audio control for e-puck2 robot using PiPuck with custom EPuck2 class"""

import asyncio
import logging

from application.interfaces.hardware.audio_interface import AudioInterface
from .epuck2 import (SOUND_OFF, SOUND_MARIO, SOUND_UNDERWORLD, SOUND_STARWARS, 
                     SOUND_TONE_4KHZ, SOUND_TONE_10KHZ, SOUND_STOP)


class AudioController(AudioInterface):
    """E-puck2 audio control using PiPuck with custom EPuck2 class"""

    def __init__(self, pipuck=None):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.pipuck = pipuck


    async def initialize(self) -> bool:
        """Initialize audio controller (PiPuck should already be initialized)"""
        if self._initialized:
            return True

        try:
            if not self.pipuck or not hasattr(self.pipuck, 'epuck') or not self.pipuck.epuck:
                raise RuntimeError("PiPuck or EPuck2 not provided or not initialized")

            self.logger.info("✅ Audio controller initialized using provided PiPuck")
            self._initialized = True
            return True
        except Exception as e:
            self.logger.error(f"❌ Audio controller initialization failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup audio resources (PiPuck cleanup handled by container)"""
        if self._initialized:
            try:
                await self._send_sound(SOUND_OFF)
                self.logger.info("🧹 Audio controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during audio cleanup: {e}")

        self._initialized = False

    async def _send_sound(self, sound_id: int) -> None:
        """Send sound command using PiPuck EPuck2 class"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            raise RuntimeError("Audio controller not initialized")

        try:
            self.pipuck.epuck.set_speaker(sound_id)
            self.logger.info(f"🔊 Sent audio command via PiPuck EPuck2: sound_id={sound_id}")

        except Exception as e:
            self.logger.error(f"❌ Audio command failed: {e}")
            raise

    async def play_beep(self, duration: float = 0.1) -> None:
        """Play a 4KHz tone as beep"""
        try:
            self.logger.info("🔊 Playing beep sound (4KHz tone) via I2C")
            await self._send_sound(SOUND_TONE_4KHZ)
            await asyncio.sleep(duration)
            await self._send_sound(SOUND_STOP)

        except Exception as e:
            self.logger.error(f"❌ Failed to play beep: {e}")

    async def play_melody(self, melody_name: str = "mario") -> None:
        """Play a melody via I2C"""
        try:
            self.logger.info(f"🎵 Playing melody '{melody_name}' via I2C")
            
            # Select sound based on melody name
            sound_map = {
                "mario": SOUND_MARIO,
                "underworld": SOUND_UNDERWORLD, 
                "starwars": SOUND_STARWARS
            }
            
            sound_id = sound_map.get(melody_name.lower(), SOUND_MARIO)
            await self._send_sound(sound_id)
            await asyncio.sleep(3.0)
            await self._send_sound(SOUND_STOP)

        except Exception as e:
            self.logger.error(f"❌ Failed to play melody '{melody_name}': {e}")

    async def stop_audio(self) -> None:
        """Stop currently playing audio"""
        try:
            await self._send_sound(SOUND_STOP)
            self.logger.debug("🔇 Audio stopped")
        except Exception as e:
            self.logger.error(f"❌ Failed to stop audio: {e}")

    @property
    def is_initialized(self) -> bool:
        """Check if audio controller is initialized"""
        return self._initialized
