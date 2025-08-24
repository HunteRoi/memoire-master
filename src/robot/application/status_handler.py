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
            await self.led.set_led_color("blue")
            await self.audio.play_connect_sound()
        except Exception as e:
            self.logger.warning(f"Client connected feedback failed: {e}")

    async def on_client_disconnected(self):
        """Provide feedback when last client disconnects - LED should be GREEN when waiting"""
        try:
            await self.led.set_led_color("green")
            await self.audio.play_disconnect_sound()
        except Exception as e:
            self.logger.warning(f"Client disconnected feedback failed: {e}")

    async def on_command_received(self):
        """Provide feedback when command is received"""
        try:
            await self.led.blink_led(0, 0, 255, 2, 0.2)
        except Exception as e:
            self.logger.warning(f"Command received feedback failed: {e}")

    async def on_command_error(self):
        """Provide feedback when command fails"""
        try:
            await self.led.blink_led(255, 0, 0, 2, 0.2)
            await self.audio.play_error_sound()
        except Exception as e:
            self.logger.warning(f"Command error feedback failed: {e}")

    async def on_startup(self):
        """Provide feedback on startup - LED should be GREEN when waiting for connection"""
        try:
            await self.led.set_led_color("green")
            self.logger.info("🚀 Robot startup complete - waiting for client connection")
        except Exception as e:
            self.logger.warning(f"Startup feedback failed: {e}")

    async def on_shutdown(self):
        """Provide feedback on shutdown"""
        try:
            await self.led.led_off()
        except Exception as e:
            self.logger.warning(f"Shutdown feedback failed: {e}")
