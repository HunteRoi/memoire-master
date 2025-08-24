"""Audio control for e-puck2 robot - GPIO buzzer + file playback"""

import asyncio
import logging
import os
import subprocess
from typing import Optional

try:
    import pigpio
except ImportError:
    pigpio = None

from application.interfaces.hardware.audio_interface import AudioInterface
from domain.entities import AudioCommand


class AudioController(AudioInterface):
    """E-puck2 audio control using pigpio buzzer + system audio commands"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.buzzer_pin = 18  # GPIO pin for buzzer (supports hardware PWM)
        self.pi = None  # pigpio instance

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
            if not pigpio:
                raise ImportError("pigpio not available")

            # Initialize pigpio for buzzer control
            self.pi = pigpio.pi()
            if not self.pi.connected:
                raise RuntimeError("Could not connect to pigpio daemon. Please run 'sudo pigpiod' to start the daemon.")

            # Setup buzzer GPIO pin
            self.pi.set_mode(self.buzzer_pin, pigpio.OUTPUT)
            self.pi.write(self.buzzer_pin, 0)  # Turn off initially

            # Set PCM volume to 100% using amixer
            await self._set_pcm_volume()

            # Run audio diagnostics
            await self._run_audio_diagnostics()

            self._initialized = True
            self.logger.info("✅ Audio controller initialized")
            return True

        except ImportError as ie:
            self.logger.error(f"❌ Required library not available for audio controller: {ie}")
            return False
        except Exception as e:
            self.logger.error(f"❌ Audio controller initialization failed: {e}")
            return False

    async def _run_audio_diagnostics(self):
        """Run audio system diagnostics"""
        try:
            self.logger.debug("🔍 Running audio diagnostics...")

            # Check available audio devices
            try:
                process = await asyncio.create_subprocess_exec(
                    'aplay', '-l',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()
                if process.returncode == 0:
                    devices = stdout.decode().strip()
                    self.logger.debug(f"🔊 Available audio devices:\n{devices}")
                else:
                    self.logger.debug(f"⚠️ Could not list audio devices: {stderr.decode().strip()}")
            except Exception as e:
                self.logger.debug(f"⚠️ Audio device listing failed: {e}")

            # Check audio files
            for file_name, file_path in self.audio_files.items():
                if os.path.exists(file_path):
                    size = os.path.getsize(file_path)
                    self.logger.debug(f"✅ Audio file '{file_name}': {file_path} ({size} bytes)")
                else:
                    self.logger.warning(f"⚠️ Missing audio file '{file_name}': {file_path}")

        except Exception as e:
            self.logger.debug(f"⚠️ Audio diagnostics failed: {e}")

    async def cleanup(self):
        """Cleanup audio resources"""
        if self._initialized:
            try:
                if self.pi and self.pi.connected:
                    self.pi.write(self.buzzer_pin, 0)  # Turn off buzzer
                    self.pi.stop()  # Disconnect from pigpio daemon
                self.logger.info("🧹 Audio controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during audio cleanup: {e}")

        self._initialized = False

    async def _set_pcm_volume(self):
        """Set PCM volume to 100% using amixer"""
        try:
            self.logger.info("🔊 Setting PCM volume to 100%...")
            result = subprocess.run(['amixer', 'set', 'PCM', '100%'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                self.logger.info("✅ PCM volume set to 100%")
                if result.stdout:
                    self.logger.debug(f"🔊 amixer output: {result.stdout.strip()}")
            else:
                stderr_text = result.stderr.strip() if result.stderr else 'No error message'
                self.logger.warning(f"⚠️ Failed to set PCM volume: {stderr_text}")

        except Exception as e:
            self.logger.warning(f"⚠️ Could not set PCM volume: {e}")


    async def play_tone(self, frequency: int, duration: float, volume: float = 1.0) -> None:
        """Play a tone using GPIO buzzer (fallback only)"""
        if not self._initialized:
            raise RuntimeError("Audio controller not initialized")

        try:
            if not self.pi or not self.pi.connected:
                raise RuntimeError("pigpio not connected")

            # Try hardware PWM first, fall back to software PWM
            try:
                # Generate tone using pigpio hardware PWM
                self.pi.hardware_PWM(self.buzzer_pin, frequency, 500000)  # 50% duty cycle
                await asyncio.sleep(duration)
                self.pi.hardware_PWM(self.buzzer_pin, 0, 0)  # Stop hardware PWM
                self.logger.debug(f"🔊 Played tone: {frequency}Hz for {duration}s (hardware PWM)")

            except Exception as hw_e:
                # Hardware PWM not available, try software PWM
                self.logger.debug(f"Hardware PWM failed ({hw_e}), trying software PWM")

                # Software PWM fallback
                self.pi.set_PWM_frequency(self.buzzer_pin, frequency)
                self.pi.set_PWM_dutycycle(self.buzzer_pin, 128)  # 50% duty cycle (0-255)

                await asyncio.sleep(duration)

                # Stop software PWM
                self.pi.set_PWM_dutycycle(self.buzzer_pin, 0)
                self.logger.debug(f"🔊 Played tone: {frequency}Hz for {duration}s (software PWM)")

        except Exception as e:
            self.logger.warning(f"⚠️ pigpio buzzer not available: {e}")
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
        """Play error sound sequence - distinctive from connect/disconnect sounds"""
        try:
            # Use distinctive error tone sequence (never use disconnect WAV file)
            # Three short low-pitched beeps to indicate error
            for i in range(3):
                await self.play_tone(300, 0.2)  # Low pitch error tone
                if i < 2:  # Don't wait after last beep
                    await asyncio.sleep(0.1)
            self.logger.debug("✅ Error sound sequence completed")
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
                # Also try relative to current directory as fallback
                fallback_path = os.path.join(os.getcwd(), 'infrastructure', 'sound_files', os.path.basename(file_path))
                if os.path.exists(fallback_path):
                    self.logger.info(f"🔍 Found audio file at fallback path: {fallback_path}")
                    file_path = fallback_path
                else:
                    self.logger.error(f"❌ Audio file not found at fallback path either: {fallback_path}")
                    return

            # Determine file type and choose appropriate player
            file_ext = os.path.splitext(file_path.lower())[1]

            if file_ext in ['.wav', '.wave']:
                cmd = ['aplay', file_path]
                self.logger.info(f"🎵 Playing WAV file with aplay: {file_path}")
            elif file_ext in ['.mp3', '.mp4', '.m4a', '.avi', '.mov']:
                cmd = ['mplayer', '-volume', str(int(volume * 100)), file_path]
                self.logger.info(f"🎵 Playing media file with mplayer (volume {int(volume * 100)}%): {file_path}")
            else:
                # Try aplay as fallback for unknown formats (no volume control)
                cmd = ['aplay', file_path]
                self.logger.info(f"🎵 Playing unknown format with aplay: {file_path}")

            self.logger.info(f"🔊 Executing audio command: {' '.join(cmd)}")

            # Execute the command using os.system for better reliability
            cmd_str = ' '.join(cmd)
            self.logger.debug(f"🔊 Executing: {cmd_str}")
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    self.logger.info(f"✅ Audio playback finished successfully: {file_path}")
                    if result.stdout:
                        self.logger.debug(f"🔊 Audio stdout: {result.stdout.strip()}")
                    
                    # Add a small delay to prevent clicking sounds
                    await asyncio.sleep(0.1)
                else:
                    stderr_text = result.stderr.strip() if result.stderr else 'No error message'
                    stdout_text = result.stdout.strip() if result.stdout else 'No output' 
                    self.logger.error(f"❌ Audio player failed with return code {result.returncode}")
                    self.logger.error(f"❌ STDERR: {stderr_text}")
                    self.logger.error(f"❌ STDOUT: {stdout_text}")
                    
                    # Try to play via buzzer as final fallback
                    self.logger.info("🔊 Attempting buzzer fallback for audio notification")
                    await self.play_tone(800, 0.5)  # Simple beep as fallback
                    
            except subprocess.TimeoutExpired:
                self.logger.error("❌ Audio playback timed out")
                await self.play_tone(800, 0.5)  # Fallback beep
            except Exception as sub_e:
                self.logger.error(f"❌ Subprocess execution failed: {sub_e}")
                # Try os.system as final fallback
                try:
                    self.logger.info(f"🔊 Trying os.system fallback: {cmd_str}")
                    exit_code = os.system(f"{cmd_str} >/dev/null 2>&1")
                    if exit_code == 0:
                        self.logger.info("✅ Audio played with os.system")
                        await asyncio.sleep(0.1)
                    else:
                        self.logger.error(f"❌ os.system also failed with code: {exit_code}")
                        await self.play_tone(800, 0.5)
                except Exception as os_e:
                    self.logger.error(f"❌ os.system fallback failed: {os_e}")
                    await self.play_tone(800, 0.5)

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
