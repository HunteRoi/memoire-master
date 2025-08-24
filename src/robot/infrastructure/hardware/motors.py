"""Motor control for e-puck2 robot - Pi-puck implementation"""

import asyncio
import logging
from typing import Optional
from pipuck.epuck import EPuck2

from application.interfaces.hardware.motor_interface import MotorInterface
from domain.entities import MotorCommand


class MotorController(MotorInterface):
    """E-puck2 motor control using PiPuck EPuck2 library"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.epuck = None
    
    async def initialize(self) -> bool:
        """Initialize EPuck2 motor control"""
        if self._initialized:
            return True
            
        try:
            # Initialize EPuck2 instance
            self.epuck = EPuck2()
            
            # Reset robot to ensure clean state
            EPuck2.reset_robot()
            
            self.logger.info("✅ Motor controller initialized with EPuck2 library")
            self._initialized = True
            return True
            
        except ImportError as ie:
            self.logger.error(f"❌ EPuck2 library not available for motor control: {ie}")
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
                self.logger.info("🧹 Motor controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during motor cleanup: {e}")
        
        self._initialized = False
        self.epuck = None
    
    async def set_speed(self, left_speed: float, right_speed: float) -> None:
        """Set motor speeds (-100 to 100) via EPuck2"""
        if not self._initialized or not self.epuck:
            raise RuntimeError("Motor controller not initialized")
        
        try:
            # Clamp speeds to valid range
            left_speed = max(-100, min(100, left_speed))
            right_speed = max(-100, min(100, right_speed))
            
            # Convert from percentage to EPuck2 speed values
            # EPuck2 typically expects values in range -1000 to 1000
            left_value = int(left_speed * 10)
            right_value = int(right_speed * 10)
            
            self.logger.info(f"🚗 Setting motor speeds: left={left_speed}% ({left_value}), right={right_speed}% ({right_value})")
            
            # Use EPuck2 motor control methods
            self.epuck.set_motor_speeds(left_value, right_value)
                
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