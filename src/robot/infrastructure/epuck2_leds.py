"""E-puck2 LED implementation using unifr-api-epuck"""

import asyncio
import logging
from typing import Optional, Dict, Tuple
from pi_puck import PiPuck
from ..domain.interfaces import LEDInterface
from ..domain.entities import LEDCommand


class EPuck2LEDs(LEDInterface):
    """E-puck2 LED control implementation"""
    
    def __init__(self):
        self.pi_puck: Optional[PiPuck] = None
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self._pattern_tasks: Dict[str, asyncio.Task] = {}
        
        # Color mapping
        self._colors = {
            "red": (255, 0, 0),
            "green": (0, 255, 0),
            "blue": (0, 0, 255),
            "yellow": (255, 255, 0),
            "purple": (255, 0, 255),
            "cyan": (0, 255, 255),
            "white": (255, 255, 255),
            "orange": (255, 165, 0),
            "off": (0, 0, 0)
        }
    
    async def initialize(self) -> bool:
        """Initialize LED hardware"""
        try:
            self.pi_puck = PiPuck()
            await asyncio.to_thread(self.pi_puck.init_leds)
            self._initialized = True
            self.logger.info("💡 E-puck2 LEDs initialized")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize LEDs: {e}")
            return False
    
    async def cleanup(self) -> None:
        """Cleanup LED hardware"""
        if self.pi_puck and self._initialized:
            try:
                # Cancel all pattern tasks
                for task in self._pattern_tasks.values():
                    task.cancel()
                self._pattern_tasks.clear()
                
                # Turn off all LEDs
                await self.set_body_led(0, 0, 0)
                await self.set_front_led(False)
                
                await asyncio.to_thread(self.pi_puck.cleanup_leds)
                self.logger.info("🧹 LEDs cleaned up")
            except Exception as e:
                self.logger.error(f"❌ Error during LED cleanup: {e}")
            finally:
                self._initialized = False
    
    async def set_color(self, color: str, pattern: str = "solid") -> None:
        """Set LED color and pattern"""
        if not self._initialized:
            raise RuntimeError("LEDs not initialized")
        
        rgb = self._colors.get(color.lower(), self._colors["white"])
        
        # Cancel existing pattern for this color
        pattern_key = f"{color}_{pattern}"
        if pattern_key in self._pattern_tasks:
            self._pattern_tasks[pattern_key].cancel()
        
        if pattern == "solid":
            await self.set_body_led(rgb[0], rgb[1], rgb[2])
            
        elif pattern == "blink":
            task = asyncio.create_task(self._blink_pattern(rgb, 0.5))
            self._pattern_tasks[pattern_key] = task
            
        elif pattern == "blink_fast":
            task = asyncio.create_task(self._blink_pattern(rgb, 0.2))
            self._pattern_tasks[pattern_key] = task
            
        elif pattern == "pulse":
            task = asyncio.create_task(self._pulse_pattern(rgb))
            self._pattern_tasks[pattern_key] = task
            
        else:
            self.logger.warning(f"Unknown LED pattern: {pattern}")
            await self.set_body_led(rgb[0], rgb[1], rgb[2])
    
    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set body LED RGB values (0-255)"""
        if not self._initialized:
            raise RuntimeError("LEDs not initialized")
        
        # Clamp values to valid range
        red = max(0, min(255, red))
        green = max(0, min(255, green))
        blue = max(0, min(255, blue))
        
        try:
            await asyncio.to_thread(self.pi_puck.set_body_led, red, green, blue)
            self.logger.debug(f"💡 Body LED set to RGB({red}, {green}, {blue})")
        except Exception as e:
            self.logger.error(f"❌ Failed to set body LED: {e}")
            raise
    
    async def set_front_led(self, enabled: bool) -> None:
        """Enable/disable front LED"""
        if not self._initialized:
            raise RuntimeError("LEDs not initialized")
        
        try:
            await asyncio.to_thread(self.pi_puck.set_front_led, enabled)
            self.logger.debug(f"💡 Front LED {'enabled' if enabled else 'disabled'}")
        except Exception as e:
            self.logger.error(f"❌ Failed to set front LED: {e}")
            raise
    
    async def execute_command(self, command: LEDCommand) -> None:
        """Execute an LED command"""
        await self.set_color(command.color, command.pattern)
        
        if command.duration is not None:
            # Run pattern for specified duration then turn off
            await asyncio.sleep(command.duration)
            await self.set_color("off", "solid")
    
    async def _blink_pattern(self, rgb: Tuple[int, int, int], interval: float) -> None:
        """Blink LED pattern"""
        try:
            while True:
                await self.set_body_led(rgb[0], rgb[1], rgb[2])
                await asyncio.sleep(interval)
                await self.set_body_led(0, 0, 0)
                await asyncio.sleep(interval)
        except asyncio.CancelledError:
            await self.set_body_led(0, 0, 0)  # Turn off when cancelled
    
    async def _pulse_pattern(self, rgb: Tuple[int, int, int]) -> None:
        """Pulse LED pattern (fade in/out)"""
        try:
            while True:
                # Fade in
                for brightness in range(0, 101, 5):
                    factor = brightness / 100.0
                    await self.set_body_led(
                        int(rgb[0] * factor),
                        int(rgb[1] * factor),
                        int(rgb[2] * factor)
                    )
                    await asyncio.sleep(0.05)
                
                # Fade out
                for brightness in range(100, -1, -5):
                    factor = brightness / 100.0
                    await self.set_body_led(
                        int(rgb[0] * factor),
                        int(rgb[1] * factor),
                        int(rgb[2] * factor)
                    )
                    await asyncio.sleep(0.05)
                    
        except asyncio.CancelledError:
            await self.set_body_led(0, 0, 0)  # Turn off when cancelled