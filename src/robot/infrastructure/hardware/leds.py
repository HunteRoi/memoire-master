"""LED control for e-puck2 robot - Pi-puck I2C + GPIO front LED"""

import asyncio
import logging
from typing import Optional
from application.interfaces.hardware.led_interface import LEDInterface
from domain.entities import LEDCommand


class LEDController(LEDInterface):
    """E-puck2 LED control using Pi-puck I2C + GPIO"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.front_led_pin = 22  # GPIO pin for front LED
    
    async def initialize(self) -> bool:
        """Initialize LED controller"""
        if self._initialized:
            return True
            
        try:
            import RPi.GPIO as GPIO
            
            # Setup front LED GPIO pin
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.setup(self.front_led_pin, GPIO.OUT)
            GPIO.output(self.front_led_pin, GPIO.LOW)
            
            self._initialized = True
            self.logger.info("✅ LED controller initialized")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ LED controller initialization failed: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup LED resources"""
        if self._initialized:
            try:
                import RPi.GPIO as GPIO
                GPIO.output(self.front_led_pin, GPIO.LOW)
                self.logger.info("🧹 LED controller cleaned up")
            except Exception as e:
                self.logger.error(f"❌ Error during LED cleanup: {e}")
        
        self._initialized = False
    
    async def set_color(self, color: str, pattern: str = "solid") -> None:
        """Set LED color and pattern"""
        color_map = {
            "red": (255, 0, 0),
            "green": (0, 255, 0),
            "blue": (0, 0, 255),
            "yellow": (255, 255, 0),
            "purple": (255, 0, 255),
            "cyan": (0, 255, 255),
            "white": (255, 255, 255),
            "off": (0, 0, 0)
        }
        
        rgb = color_map.get(color.lower(), (0, 0, 0))
        
        if pattern == "blink":
            await self.blink_led(rgb[0], rgb[1], rgb[2])
        else:
            await self.set_body_led(rgb[0], rgb[1], rgb[2])
    
    async def execute_command(self, command: LEDCommand) -> None:
        """Execute an LED command"""
        if command.action == "set_color":
            await self.set_color(command.color or "off", command.pattern or "solid")
        elif command.action == "set_rgb":
            await self.set_body_led(
                command.red or 0,
                command.green or 0,
                command.blue or 0
            )
        elif command.action == "blink":
            await self.blink_led(
                command.red or 255,
                command.green or 0,
                command.blue or 0,
                command.count or 3,
                command.speed or 0.5
            )
        elif command.action == "front_led":
            await self.set_front_led(command.enabled or False)
        else:
            self.logger.warning(f"Unknown LED command: {command.action}")
    
    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set body LED RGB using Pi-puck I2C"""
        if not self._initialized:
            raise RuntimeError("LED controller not initialized")
        
        try:
            import smbus2
            
            # Try to connect to I2C (Pi-puck uses different channels)
            try:
                bus = smbus2.SMBus(11)  # Primary channel for FT903
            except:
                bus = smbus2.SMBus(3)   # Fallback channel
            
            # Convert RGB (0-255) to Pi-puck LED colors (0x01=red, 0x02=green, 0x04=blue)
            led_value = 0
            if red > 128:
                led_value |= 0x01  # Red
            if green > 128:
                led_value |= 0x02  # Green  
            if blue > 128:
                led_value |= 0x04  # Blue
            
            # Set all 3 LEDs to the same color (registers 0x00, 0x01, 0x02)
            for led_reg in [0x00, 0x01, 0x02]:
                bus.write_byte_data(0x1C, led_reg, led_value)
            
            bus.close()
            self.logger.debug(f"💡 Body LEDs set to RGB({red}, {green}, {blue}) -> 0x{led_value:02x}")
            
        except ImportError:
            self.logger.warning("❌ smbus2 not available for Pi-puck LEDs")
            self.logger.info(f"💡 [LED] RGB({red}, {green}, {blue}) (no hardware)")
            raise
        except Exception as e:
            self.logger.error(f"❌ Failed to set Pi-puck LEDs: {e}")
            raise
    
    async def set_front_led(self, enabled: bool) -> None:
        """Set front LED on/off using GPIO"""
        if not self._initialized:
            raise RuntimeError("LED controller not initialized")
        
        try:
            import RPi.GPIO as GPIO
            GPIO.output(self.front_led_pin, GPIO.HIGH if enabled else GPIO.LOW)
            self.logger.debug(f"💡 Front LED {'ON' if enabled else 'OFF'} (GPIO pin {self.front_led_pin})")
            
        except Exception as e:
            self.logger.warning(f"⚠️ GPIO front LED not available: {e}")
            self.logger.info(f"💡 [FRONT LED] {'ON' if enabled else 'OFF'} (no hardware)")
            # Don't raise - this is non-critical
    
    async def blink_led(self, red: int, green: int, blue: int, count: int = 3, speed: float = 0.5):
        """Blink LED with specified color and pattern"""
        if not self._initialized:
            raise RuntimeError("LED controller not initialized")
        
        self.logger.info(f"💡 Blinking LED RGB({red}, {green}, {blue}) {count} times")
        
        try:
            for _ in range(count):
                # Turn on
                await self.set_body_led(red, green, blue)
                await asyncio.sleep(speed)
                
                # Turn off
                await self.set_body_led(0, 0, 0)
                await asyncio.sleep(speed)
                
        except Exception as e:
            self.logger.error(f"❌ LED blink failed: {e}")
    
    async def toggle_led(self, red: int, green: int, blue: int):
        """Toggle LED with quick off/on effect"""
        if not self._initialized:
            raise RuntimeError("LED controller not initialized")
        
        try:
            # Quick off/on toggle effect
            await self.set_body_led(0, 0, 0)
            await asyncio.sleep(0.1)
            await self.set_body_led(red, green, blue)
            
            self.logger.debug(f"💡 LED toggled to RGB({red}, {green}, {blue})")
            
        except Exception as e:
            self.logger.error(f"❌ LED toggle failed: {e}")
    
    @property
    def is_initialized(self) -> bool:
        """Check if LED controller is initialized"""
        return self._initialized