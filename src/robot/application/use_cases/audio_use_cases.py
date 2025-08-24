"""Audio use cases - Application layer business logic"""

import asyncio
import logging
from typing import Dict, Any

from application.interfaces.hardware.audio_interface import AudioInterface


class AudioUseCases:
    """Audio use cases implementation"""

    def __init__(self, audio_interface: AudioInterface):
        self.audio = audio_interface
        self.logger = logging.getLogger(__name__)
        self._initialized = False

    async def _ensure_initialized(self) -> bool:
        """Ensure audio is initialized"""
        if not self._initialized:
            self._initialized = await self.audio.initialize()
        return self._initialized

    async def play_connect_sound(self) -> Dict[str, Any]:
        """Play a sound indicating a client has connected"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }

            self.logger.info("🔊 Playing connect sound")
            await self.audio.play_beep(0.3)

            return {
                "success": True,
                "action": "play_connect_sound"
            }

        except Exception as e:
            self.logger.error(f"❌ Play connect sound failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def play_disconnect_sound(self) -> Dict[str, Any]:
        """Play a sound indicating a client has disconnected"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }

            self.logger.info("🔊 Playing disconnect sound")
            await self.audio.play_beep(0.3)

            return {
                "success": True,
                "action": "play_disconnect_sound"
            }

        except Exception as e:
            self.logger.error(f"❌ Play disconnect sound failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def play_error_sound(self) -> Dict[str, Any]:
        """Play a sound indicating an error occurred"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }

            self.logger.info("🔊 Playing error sound")
            await self.audio.play_beep(0.3)

            return {
                "success": True,
                "action": "play_error_sound"
            }

        except Exception as e:
            self.logger.error(f"❌ Play error sound failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def play_beep(self, duration: float = 0.3) -> Dict[str, Any]:
        """Play a simple beep sound using WAV file"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }

            duration = max(0.1, min(3.0, duration))

            self.logger.info(f"🔊 Playing beep sound")

            # Use beep WAV file (hardware controller handles fallback to tone if file missing)
            await self.audio.play_beep(duration)

            return {
                "success": True,
                "action": "play_beep",
                "duration": duration
            }

        except Exception as e:
            self.logger.error(f"❌ Play beep failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def stop_audio(self) -> Dict[str, Any]:
        """Stop all audio playback"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }

            self.logger.info("🔇 Stopping audio playback")

            # Use the hardware controller's stop method
            await self.audio.stop_audio()

            return {
                "success": True,
                "action": "stop_audio"
            }

        except Exception as e:
            self.logger.error(f"❌ Stop audio failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def play_melody(self, melody_name= "mario") -> Dict[str, Any]:
        """Play a predefined melody"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }

            self.logger.info(f"🎵 Playing melody: {melody_name}")

            # Use the hardware controller's melody method
            await self.audio.play_melody(melody_name)

            return {
                "success": True,
                "action": "play_melody",
                "melody_name": melody_name
            }

        except Exception as e:
            self.logger.error(f"❌ Play melody failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
