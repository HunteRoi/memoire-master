"""LED control for e-puck2 robot - Pi-puck I2C implementation"""

import asyncio
import logging
from typing import Optional

try:
    import smbus2
except ImportError:
    smbus2 = None

try:
    import pigpio
except ImportError:
    pigpio = None

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
        self.pi = None  # pigpio instance
        
        # E-puck2 I2C register addresses for LED control (via Pi-puck)
        # E-puck2 has 8 RGB LEDs around the body (LED0-LED7)
        self.led_registers = {
            'led0': 0x08,         # LED 0 RGB register  
            'led1': 0x09,         # LED 1 RGB register
            'led2': 0x0A,         # LED 2 RGB register
            'led3': 0x0B,         # LED 3 RGB register
            'led4': 0x0C,         # LED 4 RGB register
            'led5': 0x0D,         # LED 5 RGB register
            'led6': 0x0E,         # LED 6 RGB register
            'led7': 0x0F          # LED 7 RGB register
        }
    
    async def initialize(self) -> bool:
        """Initialize Pi-puck I2C LED control"""
        if self._initialized:
            return True
            
        try:
            if not smbus2:
                raise ImportError("smbus2 not available")
            if not pigpio:
                raise ImportError("pigpio not available")
                
            # Initialize pigpio for GPIO control
            self.pi = pigpio.pi()
            if not self.pi.connected:
                raise RuntimeError("Could not connect to pigpio daemon. Please run 'sudo pigpiod' to start the daemon.")
                
            # Setup front LED GPIO pin
            self.pi.set_mode(self.front_led_pin, pigpio.OUTPUT)
            self.pi.write(self.front_led_pin, 0)  # Turn off initially
            
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
            
            # Even if I2C fails, we can still use front LED via pigpio
            self.logger.warning("⚠️ Pi-puck I2C not available, only front LED will work")
            self._initialized = True
            return True
            
        except ImportError as ie:
            self.logger.error(f"❌ Required library not available for LED control: {ie}")
            return False
        except Exception as e:
            self.logger.error(f"❌ LED controller initialization failed: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup LED resources"""
        if self._initialized:
            try:
                # Turn off all e-puck2 body LEDs and Pi-puck front LED
                await self.set_body_led(0, 0, 0)
                await self.set_front_led(False)
                
                if self.i2c_bus:
                    self.i2c_bus.close()
                    
                if self.pi and self.pi.connected:
                    self.pi.write(self.front_led_pin, 0)  # Turn off front LED
                    self.pi.stop()  # Disconnect from pigpio daemon
                
                self.logger.info("🧹 LED controller cleaned up - all e-puck2 and Pi-puck LEDs turned off")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during LED cleanup: {e}")
        
        self._initialized = False
        self.i2c_bus = None
    
    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set e-puck2 body LEDs using Pi-puck LED control system"""
        if not self._initialized:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Body LED] RGB({red}, {green}, {blue}) (not initialized)")
            return
        
        # Clamp RGB values
        red = max(0, min(255, red))
        green = max(0, min(255, green)) 
        blue = max(0, min(255, blue))
        
        try:
            self.logger.info(f"💡 Setting e-puck2 body LEDs to RGB({red}, {green}, {blue})")
            
            # First, try to verify I2C communication is working
            if self.i2c_bus:
                try:
                    # Try to read a status register to verify communication
                    status = self.i2c_bus.read_byte(self.epuck_address)
                    self.logger.debug(f"🔌 I2C communication test: read byte 0x{status:02x} from e-puck2")
                except Exception as read_e:
                    self.logger.warning(f"⚠️ I2C read test failed: {read_e}")
            
            # Try Pi-puck LED control methods
            if self.i2c_bus:
                try:
                    # Method 1: Try standard e-puck2 LED registers (LED0-LED7 around the robot body)
                    # E-puck2 standard: each LED has R, G, B bytes at consecutive addresses
                    self.logger.debug(f"🔌 Trying standard e-puck2 LED control method")
                    
                    for led_id in range(8):  # E-puck2 has 8 body LEDs (LED0-LED7)
                        # Standard e-puck2 LED register layout: 
                        # LED0: R=0x08, G=0x09, B=0x0A
                        # LED1: R=0x0B, G=0x0C, B=0x0D, etc.
                        led_base_reg = 0x08 + (led_id * 3)
                        
                        # Write RGB bytes individually
                        self.i2c_bus.write_byte_data(self.epuck_address, led_base_reg, red)      # R
                        self.i2c_bus.write_byte_data(self.epuck_address, led_base_reg + 1, green) # G  
                        self.i2c_bus.write_byte_data(self.epuck_address, led_base_reg + 2, blue)  # B
                        
                        self.logger.debug(f"🔌 LED{led_id}: R=0x{led_base_reg:02x}={red}, G=0x{led_base_reg+1:02x}={green}, B=0x{led_base_reg+2:02x}={blue}")
                    
                    self.logger.info(f"✅ E-puck2 LEDs 0-7 set via standard register method")
                    return
                    
                except Exception as method1_e:
                    self.logger.debug(f"🔍 Standard e-puck2 LED method failed: {method1_e}")
                    
                    # Method 2: Try enabling LED control first, then set LEDs
                    try:
                        self.logger.debug(f"🔌 Trying to enable LED control mode first")
                        
                        # Try to enable LED control (some e-puck2 firmware requires this)
                        try:
                            self.i2c_bus.write_byte_data(self.epuck_address, 0x00, 0x01)  # Enable register
                            self.logger.debug(f"🔌 LED control enabled")
                        except:
                            pass  # If enable fails, continue anyway
                        
                        # Now try the original goto-charge.py method
                        for led_num in range(1, 4):  # LEDs 1, 2, 3 (as in goto-charge.py)
                            led_data = [red, green, blue]  # RGB for this LED
                            led_register = 0x60 + led_num  # LED registers start at 0x61, 0x62, 0x63
                            
                            self.logger.debug(f"🔌 I2C: Setting LED {led_num} at reg=0x{led_register:02x} to RGB({red}, {green}, {blue})")
                            self.i2c_bus.write_i2c_block_data(self.epuck_address, led_register, led_data)
                        
                        self.logger.info(f"✅ E-puck2 LEDs 1-3 set via goto-charge method with enable")
                        return
                        
                    except Exception as method2_e:
                        self.logger.debug(f"🔍 goto-charge method also failed: {method2_e}")
                        
                    # Method 3: Try direct LED register approach (original fallback)
                    try:
                        # Set individual LED registers (original approach as fallback)
                        for i in range(8):  # E-puck2 has 8 body LEDs
                            led_reg = 0x08 + i
                            # Try single byte approach (3-bit RGB encoding)
                            led_value = 0
                            if red > 128: led_value |= 0x04    # Red bit
                            if green > 128: led_value |= 0x02  # Green bit  
                            if blue > 128: led_value |= 0x01   # Blue bit
                            
                            self.i2c_bus.write_byte_data(self.epuck_address, led_reg, led_value)
                            
                        self.logger.info(f"✅ E-puck2 LEDs set via direct register method (fallback)")
                        return
                        
                    except Exception as method2_e:
                        self.logger.debug(f"🔍 Direct register method also failed: {method2_e}")
                        raise method2_e
                        
            # Method 3: Use system command as final fallback (if available)
            else:
                self.logger.info(f"💡 [E-puck2 LED] RGB({red}, {green}, {blue}) (I2C not available)")
                return
            
        except Exception as e:
            self.logger.error(f"❌ E-puck2 LED control failed: {e}")
            # Try to use Pi-puck front LED as visible fallback
            try:
                if red > 0 or green > 0 or blue > 0:
                    await self.set_front_led(True)
                    self.logger.info("💡 Using Pi-puck front LED as fallback indicator")
                else:
                    await self.set_front_led(False)
            except:
                pass
            raise e
    
    async def set_front_led(self, enabled: bool) -> None:
        """Set front LED on/off using GPIO"""
        if not self._initialized:
            self.logger.warning("⚠️ LED controller not initialized")
            self.logger.info(f"💡 [Front LED] {'ON' if enabled else 'OFF'} (not initialized)")
            return
        
        try:
            if not self.pi or not self.pi.connected:
                raise RuntimeError("pigpio not connected")
                
            self.pi.write(self.front_led_pin, 1 if enabled else 0)
            self.logger.debug(f"💡 Front LED {'ON' if enabled else 'OFF'} (pigpio pin {self.front_led_pin})")
            
        except Exception as e:
            self.logger.warning(f"⚠️ Front LED pigpio control failed: {e}")
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