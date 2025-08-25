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
                # Turn off all LEDs using EPuck2 API
                self.pipuck.epuck.disable_front_leds()
                self.pipuck.epuck.disable_body_leds()
                self.pipuck.set_leds_rgb(False, False, False)
                self.logger.info("🧹 LED controller cleaned up - all LEDs turned off")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during LED cleanup: {e}")

        self._initialized = False

    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set LEDs using both PiPuck native LEDs and EPuck2 API"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Body LED] RGB({red}, {green}, {blue}) (not initialized)")
            return

        # Clamp RGB values to EPuck2 range (0-100)
        red = max(0, min(100, int(red * 100 / 255)))  # Convert from 0-255 to 0-100
        green = max(0, min(100, int(green * 100 / 255)))
        blue = max(0, min(100, int(blue * 100 / 255)))

        try:
            self.logger.info(f"💡 Setting both Pi-puck and e-puck2 LEDs to RGB({red}, {green}, {blue})")

            # Set Pi-puck LEDs (boolean on/off for each color)
            # Use a threshold to determine if color should be on (>50) or off (<=50)
            pipuck_red = red > 50
            pipuck_green = green > 50
            pipuck_blue = blue > 50

            self.pipuck.set_leds_rgb(pipuck_red, pipuck_green, pipuck_blue)
            self.logger.debug(f"📡 Pi-puck LEDs: R={pipuck_red}, G={pipuck_green}, B={pipuck_blue}")

            # Set e-puck2 body LEDs using API (0-100 RGB values)
            self.pipuck.epuck.set_body_led_rgb(red, green, blue)
            self.logger.debug(f"📡 e-puck2 body LEDs: R={red}, G={green}, B={blue}")

            self.logger.info(f"✅ Both LED systems set to RGB({red}, {green}, {blue})")

        except Exception as e:
            self.logger.error(f"❌ LED control failed: {e}")
            raise e

    async def set_front_led(self, enabled: bool) -> None:
        """Set front LED on/off using EPuck2 API"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Front LED] {'ON' if enabled else 'OFF'} (not initialized)")
            return

        try:
            self.logger.debug(f"💡 Front LED {'ON' if enabled else 'OFF'}")

            # Use EPuck2 API for front LED control
            if enabled:
                self.pipuck.epuck.enable_front_leds()
            else:
                self.pipuck.epuck.disable_front_leds()

            self.logger.debug(f"✅ Front LED {'ON' if enabled else 'OFF'} via EPuck2 API")

        except Exception as e:
            self.logger.warning(f"⚠️ Front LED control failed: {e}")
            self.logger.info(f"💡 [Front LED] {'ON' if enabled else 'OFF'} (error)")

    @property
    def is_initialized(self) -> bool:
        """Check if LED controller is initialized"""
        return self._initialized
