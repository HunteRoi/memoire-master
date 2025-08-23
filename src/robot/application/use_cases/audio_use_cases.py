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
    
    async def play_tone(self, frequency: int, duration: float) -> Dict[str, Any]:
        """Play a tone with specified frequency and duration"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }
            
            # Validate parameters
            frequency = max(50, min(5000, frequency))  # Reasonable audio range
            duration = max(0.1, min(10.0, duration))   # Reasonable duration
            
            self.logger.info(f"🔊 Playing tone: {frequency}Hz for {duration}s")
            
            await self.audio.play_tone(frequency, duration)
            
            return {
                "success": True,
                "action": "play_tone",
                "frequency": frequency,
                "duration": duration
            }
            
        except Exception as e:
            self.logger.error(f"❌ Play tone failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def play_beep(self, duration: float = 0.3) -> Dict[str, Any]:
        """Play a simple beep sound"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }
            
            duration = max(0.1, min(3.0, duration))
            
            self.logger.info(f"🔊 Playing beep for {duration}s")
            
            # Standard beep frequency
            await self.audio.play_tone(800, duration)
            
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
    
    async def play_audio_file(self, file_path: str, volume: float = 0.7) -> Dict[str, Any]:
        """Play audio file from storage"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Audio not initialized"
                }
            
            if not file_path:
                return {
                    "success": False,
                    "error": "Missing file path"
                }
            
            volume = max(0.0, min(1.0, volume))
            
            self.logger.info(f"🎵 Playing audio: {file_path} at volume {volume}")
            
            # Use the hardware controller's file playback method
            await self.audio.play_audio_file(file_path, volume)
            
            return {
                "success": True,
                "action": "play_audio_file",
                "file_path": file_path,
                "volume": volume
            }
            
        except Exception as e:
            self.logger.error(f"❌ Play audio file failed: {e}")
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
    
    async def play_melody(self, melody_name: str = "happy") -> Dict[str, Any]:
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