"""E-puck2 motor implementation using unifr-api-epuck"""

import asyncio
import logging
from typing import Optional
from pi_puck import PiPuck
from ..domain.interfaces import MotorInterface
from ..domain.entities import MotorCommand


class EPuck2Motor(MotorInterface):
    """E-puck2 motor control implementation"""
    
    def __init__(self):
        self.pi_puck: Optional[PiPuck] = None
        self.logger = logging.getLogger(__name__)
        self._initialized = False
    
    async def initialize(self) -> bool:
        """Initialize motor hardware"""
        try:
            self.pi_puck = PiPuck()
            await asyncio.to_thread(self.pi_puck.init_motors)
            self._initialized = True
            self.logger.info("🚗 E-puck2 motors initialized")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize motors: {e}")
            return False
    
    async def cleanup(self) -> None:
        """Cleanup motor hardware"""
        if self.pi_puck and self._initialized:
            try:
                await self.stop()
                await asyncio.to_thread(self.pi_puck.cleanup_motors)
                self.logger.info("🧹 Motors cleaned up")
            except Exception as e:
                self.logger.error(f"❌ Error during motor cleanup: {e}")
            finally:
                self._initialized = False
    
    async def set_speed(self, left_speed: float, right_speed: float) -> None:
        """Set motor speeds (-100 to 100)"""
        if not self._initialized:
            raise RuntimeError("Motors not initialized")
        
        # Clamp speeds to valid range
        left_speed = max(-100, min(100, left_speed))
        right_speed = max(-100, min(100, right_speed))
        
        # Convert to e-puck2 motor units (approximately -1000 to 1000)
        left_motor_speed = int(left_speed * 10)
        right_motor_speed = int(right_speed * 10)
        
        try:
            await asyncio.to_thread(
                self.pi_puck.set_motor_speeds,
                left_motor_speed,
                right_motor_speed
            )
            self.logger.debug(f"🚗 Motor speeds set: L={left_speed}, R={right_speed}")
        except Exception as e:
            self.logger.error(f"❌ Failed to set motor speeds: {e}")
            raise
    
    async def stop(self) -> None:
        """Stop both motors"""
        await self.set_speed(0, 0)
        self.logger.debug("🛑 Motors stopped")
    
    async def execute_command(self, command: MotorCommand) -> None:
        """Execute a motor command"""
        await self.set_speed(command.left_speed, command.right_speed)
        
        if command.duration is not None:
            # Run for specified duration then stop
            await asyncio.sleep(command.duration)
            await self.stop()