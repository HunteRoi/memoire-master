"""Audio control for e-puck2 robot - GPIO buzzer + file playback"""

import asyncio
import logging
import os
import subprocess
from typing import Optional
from application.interfaces.hardware.audio_interface import AudioInterface
from domain.entities import AudioCommand


class AudioController(AudioInterface):
    """E-puck2 audio control using GPIO buzzer + pygame for files"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.buzzer_pin = 16  # GPIO pin for buzzer
        
        # Audio file paths
        self.audio_files_dir = os.path.join(os.path.dirname(__file__), '..', 'sound_files')
        self.audio_files = {
            'beep': os.path.join(self.audio_files_dir, 'robot_beep.wav'),
            'melody': os.path.join(self.audio_files_dir, 'robot_melody.wav'),
            'connect': os.path.join(self.audio_files_dir, 'robot_connect.wav'),
            'disconnect': os.path.join(self.audio_files_dir, 'robot_disconnect.wav')
        }

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
                GPIO.setmode(GPIO.BCM)
                GPIO.setwarnings(False)
                GPIO.output(self.buzzer_pin, GPIO.LOW)
                self.logger.info("🧹 Audio controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during audio cleanup: {e}")

        self._initialized = False

    async def play_tone(self, frequency: int, duration: float, volume: float = 1.0) -> None:
        """Play a tone using GPIO buzzer (fallback only)"""
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
        """Play a simple beep using WAV file"""
        try:
            # Use the robot_beep.wav file if available
            if os.path.exists(self.audio_files['beep']):
                self.logger.info(f"🔊 Playing beep from file: {self.audio_files['beep']}")
                await self.play_audio_file(self.audio_files['beep'])
            else:
                # Fallback to tone generation
                self.logger.info("🔊 Beep file not found, using tone fallback")
                await self.play_tone(800, duration)
        except Exception as e:
            self.logger.error(f"❌ Failed to play beep: {e}")
            # Final fallback to tone
            await self.play_tone(800, duration)

    async def play_error_sound(self) -> None:
        """Play error sound sequence"""
        try:
            # Try to use disconnect sound for errors (or could create error.wav)
            if os.path.exists(self.audio_files['disconnect']):
                await self.play_audio_file(self.audio_files['disconnect'])
            else:
                # Fallback to tone sequence
                await self.play_tone(300, 0.2)
                await asyncio.sleep(0.1)
                await self.play_tone(300, 0.2)
                await asyncio.sleep(0.1)
                await self.play_tone(300, 0.2)
        except Exception as e:
            self.logger.error(f"❌ Failed to play error sound: {e}")

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
        elif command.action == "play_melody":
            await self.play_melody(command.melody_name or "happy")
        elif command.action == "play_connect":
            await self.play_connect_sound()
        elif command.action == "play_disconnect":
            await self.play_disconnect_sound()
        else:
            self.logger.warning(f"Unknown audio command: {command.action}")

    async def play_audio_file(self, file_path: str, volume: float = 0.7) -> None:
        """Play audio file using aplay (WAV) or mplayer (MP3)"""
        if not self._initialized:
            raise RuntimeError("Audio controller not initialized")

        try:
            # Check if file exists
            if not os.path.exists(file_path):
                self.logger.error(f"❌ Audio file not found: {file_path}")
                return

            # Determine file type and choose appropriate player
            file_ext = os.path.splitext(file_path.lower())[1]
            
            if file_ext in ['.wav', '.wave']:
                # Use aplay for WAV files
                cmd = ['aplay', file_path]
                self.logger.info(f"🎵 Playing WAV file with aplay: {file_path}")
            elif file_ext in ['.mp3', '.mp4', '.m4a', '.avi', '.mov']:
                # Use mplayer for MP3 and other formats
                cmd = ['mplayer', '-really-quiet', '-volume', str(int(volume * 100)), file_path]
                self.logger.info(f"🎵 Playing media file with mplayer: {file_path}")
            else:
                # Try aplay as fallback
                cmd = ['aplay', file_path]
                self.logger.info(f"🎵 Playing unknown format with aplay: {file_path}")

            # Execute the command asynchronously
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                self.logger.debug(f"✅ Audio playback finished: {file_path}")
            else:
                self.logger.warning(f"⚠️ Audio player returned code {process.returncode}: {stderr.decode()}")

        except FileNotFoundError as e:
            self.logger.error(f"❌ Audio player not found: {e}")
            self.logger.info(f"🎵 [AUDIO] {file_path} (player not available)")
        except Exception as e:
            self.logger.error(f"❌ Failed to play audio file '{file_path}': {e}")

    async def stop_audio(self) -> None:
        """Stop currently playing audio by killing audio processes"""
        try:
            # Kill any running aplay or mplayer processes
            for process_name in ['aplay', 'mplayer']:
                try:
                    process = await asyncio.create_subprocess_exec(
                        'pkill', '-f', process_name,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    await process.communicate()
                except Exception:
                    pass  # Ignore errors if no processes found
                    
            self.logger.debug("🔇 Audio playback stopped")
        except Exception as e:
            self.logger.error(f"❌ Failed to stop audio: {e}")

    async def play_melody(self, melody_name: str = "happy") -> None:
        """Play a predefined melody using WAV file or tone sequences"""
        if not self._initialized:
            raise RuntimeError("Audio controller not initialized")
        
        try:
            # First try to use the robot_melody.wav file
            if os.path.exists(self.audio_files['melody']):
                self.logger.info(f"🎵 Playing melody from file: {self.audio_files['melody']}")
                await self.play_audio_file(self.audio_files['melody'])
                return
                
            # Fallback to tone sequences if no file found
            self.logger.info(f"🎵 Melody file not found, using tone sequence for: {melody_name}")
            
            # Define melody patterns as fallback
            melodies = {
                "happy": [(523, 0.3), (587, 0.3), (659, 0.3), (698, 0.6)],  # C-D-E-F
                "sad": [(349, 0.5), (330, 0.5), (294, 0.8)],                   # F-E-D
                "victory": [(523, 0.2), (659, 0.2), (784, 0.2), (1047, 0.6)], # C-E-G-C
                "alarm": [(800, 0.3), (400, 0.3)] * 3,                         # High-low pattern
            }

            melody = melodies.get(melody_name, melodies["happy"])
            
            for frequency, duration in melody:
                await self.play_tone(frequency, duration)
                await asyncio.sleep(0.1)  # Small pause between notes
                
            self.logger.debug(f"✅ Melody '{melody_name}' finished")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to play melody '{melody_name}': {e}")

    async def play_connect_sound(self) -> None:
        """Play connection sound"""
        try:
            if os.path.exists(self.audio_files['connect']):
                self.logger.info(f"🔊 Playing connect sound: {self.audio_files['connect']}")
                await self.play_audio_file(self.audio_files['connect'])
            else:
                # Fallback to happy tone
                await self.play_tone(1000, 0.3)
        except Exception as e:
            self.logger.error(f"❌ Failed to play connect sound: {e}")
            
    async def play_disconnect_sound(self) -> None:
        """Play disconnection sound"""
        try:
            if os.path.exists(self.audio_files['disconnect']):
                self.logger.info(f"🔊 Playing disconnect sound: {self.audio_files['disconnect']}")
                await self.play_audio_file(self.audio_files['disconnect'])
            else:
                # Fallback to low tone
                await self.play_tone(300, 0.5)
        except Exception as e:
            self.logger.error(f"❌ Failed to play disconnect sound: {e}")

    @property
    def is_initialized(self) -> bool:
        """Check if audio controller is initialized"""
        return self._initialized
