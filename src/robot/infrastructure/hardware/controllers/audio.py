"""Audio control for e-puck2 robot using PiPuck with custom EPuck2 class"""

import asyncio
import logging

from application.interfaces.hardware.audio_interface import AudioInterface


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

            self.logger.info("🎵 Audio controller initialized successfully with EPuck2 API")
            self._initialized = True
            return True
        except Exception as e:
            self.logger.error(f"❌ Audio controller initialization failed - no sound available: {e}")
            return False

    async def cleanup(self):
        """Cleanup audio resources (PiPuck cleanup handled by container)"""
        if self._initialized:
            try:
                self.pipuck.epuck.stop_sound()
                self.logger.info("🧹 Audio controller cleaned up - all sounds stopped")
            except Exception as e:
                self.logger.warning(f"⚠️ Audio cleanup error - sounds may continue playing: {e}")

        self._initialized = False

    async def _send_sound(self, sound_id: int) -> None:
        """Send sound command using EPuck2 API"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            raise RuntimeError("Audio controller not initialized")

        try:
            self.pipuck.epuck.play_sound(sound_id)
            self.logger.debug(f"🔊 Sound command sent to EPuck2: sound_id={sound_id}")

        except Exception as e:
            self.logger.error(f"❌ Audio command failed - hardware error: {e}")
            raise

    async def play_beep(self, duration: float = 1, beep_strength: int = 4) -> None:
        """Play a 4KHz tone as beep using EPuck2 API"""
        try:
            self.logger.debug(f"🎶 Playing beep sound (4KHz tone) for {duration:.1f}s")
            if beep_strength <= 4:
                self.pipuck.epuck.play_tone_4khz()
            else:
                self.pipuck.epuck.play_tone_10khz()
            await asyncio.sleep(duration)
            self.pipuck.epuck.stop_sound()

        except Exception as e:
            self.logger.error(f"❌ Beep playback failed - audio hardware error: {e}")

    async def play_melody(self, melody_name: str = "mario") -> None:
        """Play a melody via EPuck2 API"""
        try:
            self.logger.info(f"🎼 Playing '{melody_name}' melody (~3s duration)")

            # Use semantic method names from API
            melody_methods = {
                "mario": self.pipuck.epuck.play_mario,
                "underworld": self.pipuck.epuck.play_underworld,
                "starwars": self.pipuck.epuck.play_starwars
            }

            melody_method = melody_methods.get(melody_name.lower(), self.pipuck.epuck.play_mario)
            melody_method()

        except Exception as e:
            self.logger.error(f"❌ Melody '{melody_name}' playback failed - audio hardware error: {e}")

    async def stop_audio(self) -> None:
        """Stop currently playing audio using EPuck2 API"""
        try:
            self.pipuck.epuck.stop_sound()
            self.logger.debug("🔇 All audio stopped")
        except Exception as e:
            self.logger.error(f"❌ Audio stop command failed - sounds may continue: {e}")

    @property
    def is_initialized(self) -> bool:
        """Check if audio controller is initialized"""
        return self._initialized
