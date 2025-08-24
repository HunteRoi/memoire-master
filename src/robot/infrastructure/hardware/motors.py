"""Motor control for e-puck2 robot - Pi-puck I2C implementation"""

import asyncio
import logging
from typing import Optional

try:
    import smbus2
except ImportError:
    smbus2 = None

from application.interfaces.hardware.motor_interface import MotorInterface
from domain.entities import MotorCommand


class MotorController(MotorInterface):
    """E-puck2 motor control using Pi-puck I2C communication"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.i2c_bus = None
        self.rob_addr = 0x1f  # Pi-puck e-puck2 I2C slave address
        
        # Pi-puck I2C register addresses for motor control (based on Pi-puck firmware)
        self.motor_registers = {
            'left_speed': 0x46,   # Left motor speed register (Pi-puck standard)
            'right_speed': 0x47   # Right motor speed register (Pi-puck standard)
        }
        
        # Additional Pi-puck control registers that might be needed
        self.control_registers = {
            'enable': 0x01,       # Enable register (might need to be set)
            'mode': 0x02,         # Mode register  
            'status': 0x00        # Status register for reading
        }
    
    async def initialize(self) -> bool:
        """Initialize Pi-puck I2C motor control"""
        if self._initialized:
            return True
            
        try:
            if not smbus2:
                raise ImportError("smbus2 not available")
            
            # Try Pi-puck I2C buses (primary and fallback)
            for bus_num in [12, 4, 11, 3]:  # Pi-puck standard buses
                try:
                    self.i2c_bus = smbus2.SMBus(bus_num)
                    
                    # Test communication by reading from e-puck
                    test_read = self.i2c_bus.read_byte(self.rob_addr)
                    
                    self.logger.info(f"✅ Motor controller initialized on I2C bus {bus_num}")
                    self._initialized = True
                    return True
                    
                except Exception as bus_e:
                    if self.i2c_bus:
                        self.i2c_bus.close()
                        self.i2c_bus = None
                    continue
            
            self.logger.error("❌ No Pi-puck I2C bus found for motor control")
            return False
            
        except ImportError as ie:
            self.logger.error(f"❌ Required library not available for Pi-puck motor control: {ie}")
            return False
        except Exception as e:
            self.logger.error(f"❌ Motor controller initialization failed: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup motor resources"""
        if self._initialized:
            try:
                # Stop motors before cleanup
                await self.stop()
                if self.i2c_bus:
                    self.i2c_bus.close()
                self.logger.info("🧹 Motor controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during motor cleanup: {e}")
        
        self._initialized = False
        self.i2c_bus = None
    
    async def set_speed(self, left_speed: float, right_speed: float) -> None:
        """Set motor speeds (-100 to 100) via Pi-puck I2C"""
        if not self._initialized or not self.i2c_bus:
            raise RuntimeError("Motor controller not initialized")
        
        try:
            # Clamp speeds to valid range
            left_speed = max(-100, min(100, left_speed))
            right_speed = max(-100, min(100, right_speed))
            
            # Convert from float percentage to signed 16-bit values
            # Pi-puck expects values in range -1000 to 1000
            left_value = int(left_speed * 10)
            right_value = int(right_speed * 10)
            
            # Convert to signed 16-bit bytes (little-endian)
            left_bytes = left_value.to_bytes(2, byteorder='little', signed=True)
            right_bytes = right_value.to_bytes(2, byteorder='little', signed=True)
            
            self.logger.info(f"🚗 Setting motor speeds: left={left_speed}% ({left_value}), right={right_speed}% ({right_value})")
            self.logger.debug(f"🚗 Left bytes: {list(left_bytes)}, Right bytes: {list(right_bytes)}")
            
            # Send left motor speed via I2C
            try:
                self.logger.debug(f"🔌 I2C: Writing to addr=0x{self.rob_addr:02x}, reg=0x{self.motor_registers['left_speed']:02x}, data={list(left_bytes)}")
                self.i2c_bus.write_i2c_block_data(
                    self.rob_addr, 
                    self.motor_registers['left_speed'], 
                    list(left_bytes)
                )
                self.logger.debug(f"✅ Left motor speed set successfully")
            except Exception as left_e:
                self.logger.error(f"❌ Failed to set left motor speed: {left_e}")
                raise left_e
            
            # Send right motor speed via I2C
            try:
                self.logger.debug(f"🔌 I2C: Writing to addr=0x{self.rob_addr:02x}, reg=0x{self.motor_registers['right_speed']:02x}, data={list(right_bytes)}")
                self.i2c_bus.write_i2c_block_data(
                    self.rob_addr, 
                    self.motor_registers['right_speed'], 
                    list(right_bytes)
                )
                self.logger.debug(f"✅ Right motor speed set successfully")
            except Exception as right_e:
                self.logger.error(f"❌ Failed to set right motor speed: {right_e}")
                raise right_e
                
            self.logger.info(f"✅ Both motor speeds set successfully: left={left_speed}%, right={right_speed}%")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to set motor speeds: {e}")
            raise
    
    async def stop(self) -> None:
        """Stop both motors"""
        try:
            await self.set_speed(0, 0)
            self.logger.debug("🛑 Motors stopped")
        except Exception as e:
            self.logger.error(f"❌ Failed to stop motors: {e}")
            raise
    
    async def execute_command(self, command: MotorCommand) -> None:
        """Execute a motor command"""
        try:
            if command.action == "set_speed":
                await self.set_speed(command.left_speed or 0, command.right_speed or 0)
            elif command.action == "stop":
                await self.stop()
            else:
                self.logger.warning(f"Unknown motor command: {command.action}")
                
        except Exception as e:
            self.logger.error(f"❌ Motor command execution failed: {e}")
            raise
    
    @property
    def is_initialized(self) -> bool:
        """Check if motor controller is initialized"""
        return self._initialized