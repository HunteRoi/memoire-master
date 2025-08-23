"""Audio control for e-puck2 robot - GPIO buzzer + file playback"""

import asyncio
import logging
import os
from typing import Optional
from application.interfaces.hardware.audio_interface import AudioInterface
from domain.entities import AudioCommand


class AudioController(AudioInterface):
    """E-puck2 audio control using GPIO buzzer + pygame for files"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.buzzer_pin = 16  # GPIO pin for buzzer

    async def initialize(self) -> bool:
        """Initialize audio controller"""
        if self._initialized:
            return True

        try:
            import RPi.GPIO as GPIO

            # Setup buzzer GPIO pin
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.setup(self.buzzer_pin, GPIO.OUT)
            GPIO.output(self.buzzer_pin, GPIO.LOW)

            self._initialized = True
            self.logger.info("✅ Audio controller initialized")
            return True

        except Exception as e:
            self.logger.error(f"❌ Audio controller initialization failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup audio resources"""
        if self._initialized:
            try:
                import RPi.GPIO as GPIO
                GPIO.output(self.buzzer_pin, GPIO.LOW)
                self.logger.info("🧹 Audio controller cleaned up")
            except Exception as e:
                self.logger.error(f"❌ Error during audio cleanup: {e}")

        self._initialized = False

    async def play_tone(self, frequency: int, duration: float, volume: float = 1.0) -> None:
        """Play a tone using GPIO buzzer"""
        if not self._initialized:
            raise RuntimeError("Audio controller not initialized")

        try:
            import RPi.GPIO as GPIO

            # Generate tone using PWM
            buzzer_pwm = GPIO.PWM(self.buzzer_pin, frequency)
            buzzer_pwm.start(50)  # 50% duty cycle

            await asyncio.sleep(duration)

            buzzer_pwm.stop()
            GPIO.output(self.buzzer_pin, GPIO.LOW)

            self.logger.debug(f"🔊 Played tone: {frequency}Hz for {duration}s")

        except Exception as e:
            self.logger.warning(f"⚠️ GPIO buzzer not available: {e}")
            # Fallback: just log the tone
            self.logger.info(f"🔊 [BEEP] {frequency}Hz for {duration}s (no hardware)")
            await asyncio.sleep(duration)

    async def play_beep(self, duration: float = 0.1) -> None:
        """Play a simple beep"""
        await self.play_tone(800, duration)

    async def play_error_sound(self) -> None:
        """Play error sound sequence"""
        await self.play_tone(300, 0.2)
        await asyncio.sleep(0.1)
        await self.play_tone(300, 0.2)
        await asyncio.sleep(0.1)
        await self.play_tone(300, 0.2)

    async def execute_command(self, command: AudioCommand) -> None:
        """Execute an audio command"""
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
        elif command.action == "play_file" and command.file_path:
            await self.play_audio_file(command.file_path, command.volume or 0.7)
        else:
            self.logger.warning(f"Unknown audio command: {command.action}")

    async def play_audio_file(self, file_path: str, volume: float = 0.7) -> None:
        """Play audio file using pygame"""
        if not self._initialized:
            raise RuntimeError("Audio controller not initialized")

        try:
            import pygame

            # Check if file exists
            if not os.path.exists(file_path):
                self.logger.error(f"❌ Audio file not found: {file_path}")
                return

            # Initialize pygame mixer if not already done
            if not pygame.mixer.get_init():
                pygame.mixer.init()
                self.logger.debug("🎵 Pygame mixer initialized")

            # Set volume (0.0 to 1.0)
            pygame.mixer.music.set_volume(volume)

            # Load and play the file
            pygame.mixer.music.load(file_path)
            pygame.mixer.music.play()

            self.logger.info(f"🎵 Playing audio file: {file_path}")

            # Wait for playback to finish
            while pygame.mixer.music.get_busy():
                await asyncio.sleep(0.1)

            self.logger.debug(f"✅ Audio playback finished: {file_path}")

        except ImportError:
            self.logger.warning("❌ pygame not available for audio file playback")
            self.logger.info(f"🎵 [AUDIO] {file_path} (no pygame)")
        except Exception as e:
            self.logger.error(f"❌ Failed to play audio file '{file_path}': {e}")

    async def stop_audio(self) -> None:
        """Stop currently playing audio"""
        try:
            import pygame
            if pygame.mixer.get_init():
                pygame.mixer.music.stop()
                self.logger.debug("🔇 Audio playback stopped")
        except ImportError:
            self.logger.info("🔇 [STOP AUDIO] (no pygame)")
        except Exception as e:
            self.logger.error(f"❌ Failed to stop audio: {e}")

    @property
    def is_initialized(self) -> bool:
        """Check if audio controller is initialized"""
        return self._initialized
