"""Audio control for e-puck2 robot using PiPuck with custom EPuck2 class"""

import asyncio
import logging

from application.interfaces.hardware.audio_interface import AudioInterface
from domain.entities import AudioCommand


class AudioController(AudioInterface):
    """E-puck2 audio control using PiPuck with custom EPuck2 class"""

    def __init__(self, pipuck=None):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.pipuck = pipuck
        
        # Speaker sound IDs from Pi-puck documentation
        # 0 = no sound, 1 = beep, 2 = mario theme
        self.SOUND_NONE = 0
        self.SOUND_BEEP = 1
        self.SOUND_MARIO = 2

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
                # Stop any playing sound
                await self._send_sound(self.SOUND_NONE)
                self.logger.info("🧹 Audio controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during audio cleanup: {e}")

        self._initialized = False

    async def _send_sound(self, sound_id: int) -> None:
        """Send sound command using PiPuck EPuck2 class"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            raise RuntimeError("Audio controller not initialized")

        try:
            # Use PiPuck EPuck2 class to set speaker
            self.pipuck.epuck.set_speaker(sound_id)
            self.logger.debug(f"🔊 Sent audio command via PiPuck EPuck2: sound_id={sound_id}")

        except Exception as e:
            self.logger.error(f"❌ Audio command failed: {e}")
            raise

    async def play_beep(self, duration: float = 0.1) -> None:
        """Play a simple beep using I2C Speaker"""
        try:
            self.logger.info("🔊 Playing beep sound via I2C")
            await self._send_sound(self.SOUND_BEEP)
            
            # Wait for beep to play, then turn off
            await asyncio.sleep(duration)
            await self._send_sound(self.SOUND_NONE)
            
        except Exception as e:
            self.logger.error(f"❌ Failed to play beep: {e}")

    async def play_melody(self, melody_name: str = "happy") -> None:
        """Play a melody - for now just Mario theme via I2C"""
        try:
            self.logger.info(f"🎵 Playing melody '{melody_name}' (Mario theme) via I2C")
            await self._send_sound(self.SOUND_MARIO)
            
            # Let Mario theme play for a bit, then turn off
            await asyncio.sleep(3.0)  # Mario theme duration
            await self._send_sound(self.SOUND_NONE)
            
        except Exception as e:
            self.logger.error(f"❌ Failed to play melody '{melody_name}': {e}")

    async def play_connect_sound(self) -> None:
        """Play connection sound - crescendo using beep"""
        try:
            self.logger.info("🔊 Playing connect sound (crescendo) via I2C")
            
            # Simple crescendo: quick beeps getting faster
            for i in range(3):
                await self._send_sound(self.SOUND_BEEP)
                await asyncio.sleep(0.1)
                await self._send_sound(self.SOUND_NONE)
                await asyncio.sleep(0.1 - i * 0.02)  # Get faster
                
        except Exception as e:
            self.logger.error(f"❌ Failed to play connect sound: {e}")

    async def play_disconnect_sound(self) -> None:
        """Play disconnection sound - decrescendo using beep"""
        try:
            self.logger.info("🔊 Playing disconnect sound (decrescendo) via I2C")
            
            # Simple decrescendo: quick beeps getting slower
            for i in range(3):
                await self._send_sound(self.SOUND_BEEP)
                await asyncio.sleep(0.1)
                await self._send_sound(self.SOUND_NONE)
                await asyncio.sleep(0.1 + i * 0.05)  # Get slower
                
        except Exception as e:
            self.logger.error(f"❌ Failed to play disconnect sound: {e}")

    async def play_error_sound(self) -> None:
        """Play error sound - just a beep"""
        try:
            self.logger.info("🔊 Playing error sound via I2C")
            await self.play_beep(0.2)
        except Exception as e:
            self.logger.error(f"❌ Failed to play error sound: {e}")

    # Legacy methods for compatibility
    async def play_tone(self, frequency: int, duration: float, volume: float = 1.0) -> None:
        """Legacy method - just play a beep"""
        await self.play_beep(duration)

    async def play_audio_file(self, file_path: str, volume: float = 0.7) -> None:
        """Legacy method - just play a beep"""
        await self.play_beep()

    async def stop_audio(self) -> None:
        """Stop currently playing audio"""
        try:
            await self._send_sound(self.SOUND_NONE)
            self.logger.debug("🔇 Audio stopped")
        except Exception as e:
            self.logger.error(f"❌ Failed to stop audio: {e}")

    async def execute_command(self, command: AudioCommand) -> None:
        """Execute an audio command"""
        try:
            if command.action == "play_tone":
                await self.play_tone(
                    command.frequency or 800,
                    command.duration or 0.5,
                    command.volume or 1.0
                )
            elif command.action == "play_beep":
                await self.play_beep(command.duration or 0.1)
            elif command.action == "play_error":
                await self.play_error_sound()
            elif command.action == "play_file":
                await self.play_audio_file(command.file_path or "", command.volume or 0.7)
            elif command.action == "play_melody":
                await self.play_melody(command.melody_name or "happy")
            elif command.action == "play_connect":
                await self.play_connect_sound()
            elif command.action == "play_disconnect":
                await self.play_disconnect_sound()
            else:
                self.logger.warning(f"Unknown audio command: {command.action}")
        except Exception as e:
            self.logger.error(f"❌ Audio command execution failed: {e}")

    @property
    def is_initialized(self) -> bool:
        """Check if audio controller is initialized"""
        return self._initialized