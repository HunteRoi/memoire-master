"""LED control for e-puck2 robot - Pi-puck I2C implementation"""

import asyncio
import logging
from typing import Optional
from application.interfaces.hardware.led_interface import LEDInterface
from domain.entities import LEDCommand


class LEDController(LEDInterface):
    """E-puck2 LED control using Pi-puck I2C communication"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.i2c_bus = None
        self.epuck_address = 0x1f  # Pi-puck e-puck2 I2C slave address
        self.front_led_pin = 22  # GPIO pin for front LED (Pi-puck specific)
        
        # Pi-puck I2C register addresses for LED control
        self.led_registers = {
            'body_led': 0x08,     # Body LED register
            'led0': 0x08,         # LED 0 register  
            'led1': 0x09,         # LED 1 register
            'led2': 0x0A,         # LED 2 register
            'led3': 0x0B          # LED 3 register
        }
    
    async def initialize(self) -> bool:
        """Initialize Pi-puck I2C LED control"""
        if self._initialized:
            return True
            
        try:
            import smbus2
            import RPi.GPIO as GPIO
            
            # Setup front LED GPIO pin
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.setup(self.front_led_pin, GPIO.OUT)
            GPIO.output(self.front_led_pin, GPIO.LOW)
            
            # Try Pi-puck I2C buses for body LEDs
            for bus_num in [12, 4, 11, 3]:  # Pi-puck standard buses
                try:
                    self.i2c_bus = smbus2.SMBus(bus_num)
                    
                    # Test communication by reading from e-puck
                    self.i2c_bus.read_byte(self.epuck_address)
                    
                    self.logger.info(f"✅ LED controller initialized on I2C bus {bus_num}")
                    self._initialized = True
                    return True
                    
                except Exception as bus_e:
                    if self.i2c_bus:
                        self.i2c_bus.close()
                        self.i2c_bus = None
                    continue
            
            # Even if I2C fails, we can still use front LED via GPIO
            self.logger.warning("⚠️ Pi-puck I2C not available, only front LED will work")
            self._initialized = True
            return True
            
        except ImportError:
            self.logger.error("❌ smbus2 or RPi.GPIO not available for LED control")
            return False
        except Exception as e:
            self.logger.error(f"❌ LED controller initialization failed: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup LED resources"""
        if self._initialized:
            try:
                # Turn off all LEDs
                await self.set_body_led(0, 0, 0)
                await self.set_front_led(False)
                
                if self.i2c_bus:
                    self.i2c_bus.close()
                    
                import RPi.GPIO as GPIO
                GPIO.setmode(GPIO.BCM)
                GPIO.setwarnings(False)
                GPIO.output(self.front_led_pin, GPIO.LOW)
                
                self.logger.info("🧹 LED controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during LED cleanup: {e}")
        
        self._initialized = False
        self.i2c_bus = None
    
    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set body LED RGB using Pi-puck I2C"""
        if not self._initialized:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Body LED] RGB({red}, {green}, {blue}) (not initialized)")
            return
        
        # Clamp RGB values
        red = max(0, min(255, red))
        green = max(0, min(255, green)) 
        blue = max(0, min(255, blue))
        
        # If no I2C bus available, just log
        if not self.i2c_bus:
            self.logger.info(f"💡 [Body LED] RGB({red}, {green}, {blue}) (I2C not available)")
            return
        
        try:
            # Pi-puck LED encoding: combine RGB into single byte
            # Bit pattern: 0b00000RGB (3-bit color)
            led_value = 0
            if red > 128:
                led_value |= 0x01  # Red bit
            if green > 128:
                led_value |= 0x02  # Green bit
            if blue > 128:
                led_value |= 0x04  # Blue bit
            
            # Set all body LEDs to same color (LEDs 0-3)
            for led_reg in [self.led_registers['led0'], self.led_registers['led1'], 
                           self.led_registers['led2'], self.led_registers['led3']]:
                self.i2c_bus.write_byte_data(self.epuck_address, led_reg, led_value)
            
            self.logger.debug(f"💡 Body LEDs set to RGB({red}, {green}, {blue}) -> 0x{led_value:02x}")
            
        except Exception as e:
            self.logger.warning(f"⚠️ Body LED control failed, fallback mode: {e}")
            self.logger.info(f"💡 [Body LED] RGB({red}, {green}, {blue}) (fallback)")
    
    async def set_front_led(self, enabled: bool) -> None:
        """Set front LED on/off using GPIO"""
        if not self._initialized:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Front LED] {'ON' if enabled else 'OFF'} (not initialized)")
            return
        
        try:
            import RPi.GPIO as GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.output(self.front_led_pin, GPIO.HIGH if enabled else GPIO.LOW)
            self.logger.debug(f"💡 Front LED {'ON' if enabled else 'OFF'} (GPIO pin {self.front_led_pin})")
            
        except Exception as e:
            self.logger.warning(f"⚠️ Front LED GPIO control failed: {e}")
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