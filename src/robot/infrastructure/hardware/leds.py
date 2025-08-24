"""LED control for e-puck2 robot using PiPuck with custom EPuck2 class"""

import logging

from application.interfaces.hardware.led_interface import LEDInterface


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
        """Set LEDs using both PiPuck native LEDs and EPuck2 packet"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Body LED] RGB({red}, {green}, {blue}) (not initialized)")
            return

        # Clamp RGB values
        red = max(0, min(255, red))
        green = max(0, min(255, green))
        blue = max(0, min(255, blue))

        try:
            self.logger.info(f"💡 Setting LEDs to RGB({red}, {green}, {blue})")

            self.pipuck.set_leds_rgb(red > 0, green > 0, blue > 0)
            self.pipuck.epuck.set_body_led_rgb(red, green, blue)

            self.logger.info(f"✅ LEDs set to RGB({red}, {green}, {blue}) via dual approach")

        except Exception as e:
            self.logger.error(f"❌ LED control failed: {e}")
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

    @property
    def is_initialized(self) -> bool:
        """Check if LED controller is initialized"""
        return self._initialized
