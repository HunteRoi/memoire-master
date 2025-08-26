"""Motor control for e-puck2 robot using PiPuck with custom EPuck2 class"""

import logging

from application.interfaces.hardware.motor_interface import MotorInterface


class MotorController(MotorInterface):
    """E-puck2 motor control using PiPuck with custom EPuck2 class"""

    def __init__(self, pipuck=None):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.pipuck = pipuck

    async def initialize(self) -> bool:
        """Initialize motor controller (PiPuck should already be initialized)"""
        if self._initialized:
            return True

        try:
            if not self.pipuck or not hasattr(self.pipuck, 'epuck') or not self.pipuck.epuck:
                raise RuntimeError("PiPuck or EPuck2 not provided or not initialized")

            self.logger.info("⚙️ Motor controller initialized - left and right motors ready")
            self._initialized = True
            return True
        except Exception as e:
            self.logger.error(f"❌ Motor controller initialization failed - no movement available: {e}")
            return False

    async def cleanup(self):
        """Cleanup motor resources (PiPuck cleanup handled by container)"""
        if self._initialized:
            try:
                # Stop motors before cleanup
                await self.stop()
                self.logger.info("🧹 Motor controller cleaned up - all motors stopped")
            except Exception as e:
                self.logger.warning(f"⚠️ Motor cleanup error - motors may continue running: {e}")

        self._initialized = False

    async def set_speed(self, left_speed: float, right_speed: float) -> None:
        """Set motor speeds (-1000 to 1000) using EPuck2 API"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            raise RuntimeError("Motor controller not initialized")

        try:
            self.logger.debug(f"🚗 Motor command: left={left_speed}, right={right_speed}")

            # Use EPuck2 API - detect common movement patterns for better semantic control
            if left_speed == right_speed:
                if left_speed > 0:
                    # Both motors forward - use go_forward
                    self.pipuck.epuck.go_forward(abs(left_speed))
                    self.logger.debug(f"➡️ Forward motion at {abs(left_speed)} speed")
                elif left_speed < 0:
                    # Both motors backward - use go_backward
                    self.pipuck.epuck.go_backward(abs(left_speed))
                    self.logger.debug(f"⬅️ Backward motion at {abs(left_speed)} speed")
                else:
                    # Both motors stopped
                    self.pipuck.epuck.stop_motor()
                    self.logger.debug("🛑 Motors stopped")
            elif left_speed == -right_speed:
                if left_speed < 0:
                    # Left negative, right positive - turn left
                    self.pipuck.epuck.turn_left(abs(right_speed))
                    self.logger.debug(f"↪️ Left turn at {abs(right_speed)} speed")
                else:
                    # Left positive, right negative - turn right
                    self.pipuck.epuck.turn_right(abs(left_speed))
                    self.logger.debug(f"↩️ Right turn at {abs(left_speed)} speed")
            else:
                # Complex movement - use direct motor speeds
                self.pipuck.epuck.set_motor_speeds(left_speed, right_speed)
                self.logger.debug(f"🎯 Custom motion: L={left_speed}, R={right_speed}")

        except Exception as e:
            self.logger.error(f"❌ Motor speed control failed - movement unavailable: {e}")
            raise

    async def stop(self) -> None:
        """Stop both motors"""
        await self.set_speed(0, 0)

    @property
    def is_initialized(self) -> bool:
        """Check if motor controller is initialized"""
        return self._initialized
