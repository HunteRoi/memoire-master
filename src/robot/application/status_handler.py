"""Status handler for robot feedback - Application layer"""

import logging
from application.use_cases.led_use_cases import LEDUseCases
from application.use_cases.audio_use_cases import AudioUseCases


class StatusHandler:
    """Handles robot status feedback through LEDs and audio"""

    def __init__(self, led_use_cases: LEDUseCases, audio_use_cases: AudioUseCases):
        self.led = led_use_cases
        self.audio = audio_use_cases
        self.logger = logging.getLogger(__name__)

    async def on_client_connected(self):
        """Provide feedback when client connects - LED should be BLUE when connected"""
        try:
            await self.led.set_led_color("blue")  # Blue when client is connected
            # Use connection sound WAV file if available, otherwise beep
            try:
                await self.audio.audio.play_connect_sound()
            except:
                await self.audio.play_beep(0.2)
        except Exception as e:
            self.logger.warning(f"Client connected feedback failed: {e}")

    async def on_client_disconnected(self):
        """Provide feedback when last client disconnects - LED should be GREEN when waiting"""
        try:
            await self.led.set_led_color("green")  # Green when waiting for connection
            # Use disconnection sound WAV file if available, otherwise tone
            try:
                await self.audio.audio.play_disconnect_sound()
            except:
                await self.audio.play_tone(300, 0.5)
        except Exception as e:
            self.logger.warning(f"Client disconnected feedback failed: {e}")

    async def on_command_received(self):
        """Provide feedback when command is received"""
        try:
            await self.led.blink_led(0, 0, 255, 1, 0.1)  # Quick blue blink
        except Exception as e:
            self.logger.warning(f"Command received feedback failed: {e}")

    async def on_command_error(self):
        """Provide feedback when command fails"""
        try:
            await self.led.blink_led(255, 0, 0, 2, 0.2)  # Red blink for errors
            # Use error sound (disconnect) WAV file if available, otherwise tone
            try:
                await self.audio.audio.play_error_sound()
            except:
                await self.audio.play_tone(300, 0.3)
        except Exception as e:
            self.logger.warning(f"Command error feedback failed: {e}")

    async def on_startup(self):
        """Provide feedback on startup - LED should be GREEN when waiting for connection"""
        try:
            await self.led.set_led_color("green")  # Green when waiting for connection
            # No sound on startup - robot should be quiet when starting
            # Sound will only play when client connects
            self.logger.info("🚀 Robot startup complete - waiting for client connection")
        except Exception as e:
            self.logger.warning(f"Startup feedback failed: {e}")

    async def on_shutdown(self):
        """Provide feedback on shutdown"""
        try:
            await self.led.led_off()
        except Exception as e:
            self.logger.warning(f"Shutdown feedback failed: {e}")
