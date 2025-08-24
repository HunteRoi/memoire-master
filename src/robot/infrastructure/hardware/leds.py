"""LED control for e-puck2 robot using PiPuck with custom EPuck2 class"""

import logging

from application.interfaces.hardware.led_interface import LEDInterface
from domain.entities import LEDCommand


class LEDController(LEDInterface):
    """E-puck2 LED control using PiPuck with custom EPuck2 class"""

    def __init__(self, pipuck=None):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.pipuck = pipuck

    async def initialize(self) -> bool:
        """Initialize LED controller (PiPuck should already be initialized)"""
        if self._initialized:
            return True

        try:
            if not self.pipuck or not hasattr(self.pipuck, 'epuck') or not self.pipuck.epuck:
                raise RuntimeError("PiPuck or EPuck2 not provided or not initialized")
                
            self.logger.info("✅ LED controller initialized using provided PiPuck")
            self._initialized = True
            return True
        except Exception as e:
            self.logger.error(f"❌ LED controller initialization failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup LED resources (PiPuck cleanup handled by container)"""
        if self._initialized:
            try:
                # Turn off all LEDs
                await self.set_body_led(0, 0, 0)
                self.logger.info("🧹 LED controller cleaned up - all LEDs turned off")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during LED cleanup: {e}")

        self._initialized = False

    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set e-puck2 body LEDs using EPuck2 class"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Body LED] RGB({red}, {green}, {blue}) (not initialized)")
            return

        # Clamp RGB values
        red = max(0, min(255, red))
        green = max(0, min(255, green))
        blue = max(0, min(255, blue))

        try:
            self.logger.info(f"💡 Setting e-puck2 body LEDs to RGB({red}, {green}, {blue})")

            # Use PiPuck EPuck2 class to set RGB LEDs
            self.pipuck.epuck.set_body_led_rgb(red, green, blue)
            
            self.logger.info(f"✅ E-puck2 LEDs set to RGB({red}, {green}, {blue}) via EPuck2")

        except Exception as e:
            self.logger.error(f"❌ E-puck2 LED control failed: {e}")
            raise e

    async def set_front_led(self, enabled: bool) -> None:
        """Set front LED on/off using EPuck2 class"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Front LED] {'ON' if enabled else 'OFF'} (not initialized)")
            return

        try:
            self.logger.debug(f"💡 Front LED {'ON' if enabled else 'OFF'}")

            # Use PiPuck EPuck2 class to set front LEDs
            if enabled:
                self.pipuck.epuck.set_front_leds(True, True, True, True)  # All 4 front LEDs on
            else:
                self.pipuck.epuck.set_front_leds(False, False, False, False)  # All 4 front LEDs off
            
            self.logger.debug(f"✅ Front LED {'ON' if enabled else 'OFF'} via EPuck2")

        except Exception as e:
            self.logger.warning(f"⚠️ Front LED control failed: {e}")
            self.logger.info(f"💡 [Front LED] {'ON' if enabled else 'OFF'} (error)")

    async def execute_command(self, command: LEDCommand) -> None:
        """Execute an LED command"""
        try:
            if command.action == "set_rgb":
                await self.set_body_led(
                    command.red or 0,
                    command.green or 0,
                    command.blue or 0
                )
            elif command.action == "front_led":
                await self.set_front_led(command.enabled or False)
            else:
                self.logger.warning(f"Unknown LED command: {command.action}")

        except Exception as e:
            self.logger.error(f"❌ LED command execution failed: {e}")
            raise

    @property
    def is_initialized(self) -> bool:
        """Check if LED controller is initialized"""
        return self._initialized