"""LED use cases - Application layer business logic"""

import asyncio
import logging
from typing import Dict, Any

from application.interfaces.hardware.led_interface import LEDInterface


class LEDUseCases:
    """LED use cases implementation"""

    def __init__(self, led_interface: LEDInterface):
        self.led = led_interface
        self.logger = logging.getLogger(__name__)
        self._initialized = False

        # Predefined colors
        self.colors = {
            "red": (255, 0, 0),
            "green": (0, 255, 0),
            "blue": (0, 0, 255),
            "yellow": (255, 255, 0),
            "purple": (255, 0, 255),
            "cyan": (0, 255, 255),
            "white": (255, 255, 255),
            "orange": (255, 165, 0),
            "pink": (255, 192, 203),
            "off": (0, 0, 0)
        }

    @property
    def is_initialized(self) -> bool:
        """Check if LED interface is initialized"""
        return self._initialized

    async def _ensure_initialized(self) -> bool:
        """Ensure LED is initialized"""
        if not self._initialized:
            self._initialized = await self.led.initialize()
        return self._initialized

    async def set_led_rgb(self, red: int, green: int, blue: int) -> Dict[str, Any]:
        """Set LED RGB values (0-255)"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "LED not initialized"
                }

            # Clamp values to valid range
            red = max(0, min(255, red))
            green = max(0, min(255, green))
            blue = max(0, min(255, blue))

            self.logger.info(f"💡 Setting LED to RGB({red}, {green}, {blue})")

            # This should throw an exception if I2C communication fails
            await self.led.set_body_led(red, green, blue)

            self.logger.info(f"✅ LED RGB successfully set to ({red}, {green}, {blue})")

            return {
                "success": True,
                "action": "set_led_rgb",
                "red": red,
                "green": green,
                "blue": blue
            }

        except Exception as e:
            self.logger.error(f"❌ Set LED RGB failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def set_led_color(self, color: str) -> Dict[str, Any]:
        """Set LED to predefined color"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "LED not initialized"
                }

            color_name = color.lower()

            if color_name not in self.colors:
                available_colors = ", ".join(self.colors.keys())
                return {
                    "success": False,
                    "error": f"Unknown color '{color_name}'. Available: {available_colors}"
                }

            red, green, blue = self.colors[color_name]

            self.logger.info(f"💡 Setting LED to {color_name} RGB({red}, {green}, {blue})")

            # This should throw an exception if I2C communication fails
            await self.led.set_body_led(red, green, blue)

            self.logger.info(f"✅ LED color successfully set to {color_name}")

            return {
                "success": True,
                "action": "set_led_color",
                "color": color_name,
                "red": red,
                "green": green,
                "blue": blue
            }

        except Exception as e:
            self.logger.error(f"❌ Set LED color failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def blink_led(self, red: int, green: int, blue: int, count: int = 3, speed: float = 0.5) -> Dict[str, Any]:
        """Blink LED with specified color and pattern"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "LED not initialized"
                }

            # Validate parameters
            red = max(0, min(255, red))
            green = max(0, min(255, green))
            blue = max(0, min(255, blue))
            count = max(1, min(20, count))
            speed = max(0.1, min(5.0, speed))

            self.logger.info(f"💡 Blinking LED RGB({red}, {green}, {blue}) {count} times at {speed}s intervals")

            for i in range(count):
                self.logger.debug(f"💡 Blink {i+1}/{count}: turning ON")
                # Turn on
                await self.led.set_body_led(red, green, blue)
                await asyncio.sleep(speed)

                self.logger.debug(f"💡 Blink {i+1}/{count}: turning OFF")
                # Turn off
                await self.led.set_body_led(0, 0, 0)
                await asyncio.sleep(speed)

            self.logger.info(f"✅ LED blink sequence completed successfully")

            return {
                "success": True,
                "action": "blink_led",
                "red": red,
                "green": green,
                "blue": blue,
                "count": count,
                "speed": speed
            }

        except Exception as e:
            self.logger.error(f"❌ Blink LED failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def led_off(self) -> Dict[str, Any]:
        """Turn off all LEDs"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "LED not initialized"
                }

            self.logger.info("💡 Turning off all LEDs")

            await self.led.set_body_led(0, 0, 0)
            await self.led.set_front_led(False)

            return {
                "success": True,
                "action": "led_off"
            }

        except Exception as e:
            self.logger.error(f"❌ LED off failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def set_front_led(self, enabled: bool) -> Dict[str, Any]:
        """Set front LED on/off"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "LED not initialized"
                }

            self.logger.info(f"💡 Setting front LED {'ON' if enabled else 'OFF'}")

            await self.led.set_front_led(enabled)

            return {
                "success": True,
                "action": "set_front_led",
                "enabled": enabled
            }

        except Exception as e:
            self.logger.error(f"❌ Set front LED failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
