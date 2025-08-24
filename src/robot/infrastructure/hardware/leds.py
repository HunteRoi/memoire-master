"""LED control for e-puck2 robot - Pi-puck implementation"""

import logging
from pipuck import PiPuck

from application.interfaces.hardware.led_interface import LEDInterface
from domain.entities import LEDCommand


class LEDController(LEDInterface):
    """E-puck2 LED control using PiPuck library"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.pipuck = None

    async def initialize(self) -> bool:
        """Initialize PiPuck LED control"""
        if self._initialized:
            return True

        try:
            # Initialize PiPuck for e-puck2 with no ToF sensors
            self.pipuck = PiPuck(epuck_version=2, tof_sensors=[False]*6, yrl_expansion=False)
            
            # Turn off all LEDs initially
            self.pipuck.set_leds_colour('off')
            
            self.logger.info("✅ LED controller initialized with PiPuck library")
            self._initialized = True
            return True

        except ImportError as ie:
            self.logger.error(f"❌ PiPuck library not available for LED control: {ie}")
            return False
        except Exception as e:
            self.logger.error(f"❌ LED controller initialization failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup LED resources"""
        if self._initialized:
            try:
                # Turn off all LEDs
                if self.pipuck:
                    self.pipuck.set_leds_colour('off')

                self.logger.info("🧹 LED controller cleaned up - all LEDs turned off")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during LED cleanup: {e}")

        self._initialized = False
        self.pipuck = None

    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set e-puck2 body LEDs using PiPuck library"""
        if not self._initialized or not self.pipuck:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Body LED] RGB({red}, {green}, {blue}) (not initialized)")
            return

        # Clamp RGB values
        red = max(0, min(255, red))
        green = max(0, min(255, green))
        blue = max(0, min(255, blue))

        try:
            self.logger.info(f"💡 Setting e-puck2 body LEDs to RGB({red}, {green}, {blue})")

            # Use PiPuck RGB control
            red_on = red > 127
            green_on = green > 127
            blue_on = blue > 127
            
            self.pipuck.set_leds_rgb(red=red_on, green=green_on, blue=blue_on)
            
            self.logger.info(f"✅ E-puck2 LEDs set via PiPuck library")

        except Exception as e:
            self.logger.error(f"❌ E-puck2 LED control failed: {e}")
            raise e

    async def set_front_led(self, enabled: bool) -> None:
        """Set front LED on/off using PiPuck"""
        if not self._initialized or not self.pipuck:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Front LED] {'ON' if enabled else 'OFF'} (not initialized)")
            return

        try:
            # Use body LEDs as front indicator since PiPuck controls all LEDs together
            if enabled:
                self.pipuck.set_leds_colour('white')
            else:
                self.pipuck.set_leds_colour('off')
            
            self.logger.debug(f"💡 Front LED {'ON' if enabled else 'OFF'} via PiPuck")

        except Exception as e:
            self.logger.warning(f"⚠️ Front LED PiPuck control failed: {e}")
            self.logger.info(f"💡 [Front LED] {'ON' if enabled else 'OFF'} (fallback)")

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
