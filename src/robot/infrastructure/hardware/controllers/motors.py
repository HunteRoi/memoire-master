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

            self.logger.info("✅ Motor controller initialized using provided PiPuck")
            self._initialized = True
            return True
        except Exception as e:
            self.logger.error(f"❌ Motor controller initialization failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup motor resources (PiPuck cleanup handled by container)"""
        if self._initialized:
            try:
                # Stop motors before cleanup
                await self.stop()
                self.logger.info("🧹 Motor controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during motor cleanup: {e}")

        self._initialized = False

    async def set_speed(self, left_speed: float, right_speed: float) -> None:
        """Set motor speeds (-100 to 100) using EPuck2 API"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            raise RuntimeError("Motor controller not initialized")

        try:
            self.logger.info(f"🚗 Setting motor speeds: left={left_speed}, right={right_speed})")

            # Use EPuck2 API - detect common movement patterns for better semantic control
            if left_speed == right_speed:
                if left_speed > 0:
                    # Both motors forward - use go_forward
                    self.pipuck.epuck.go_forward(abs(left_speed))
                    self.logger.info(f"✅ Moving forward at speed {abs(left_speed)} via EPuck2")
                elif left_speed < 0:
                    # Both motors backward - use go_backward
                    self.pipuck.epuck.go_backward(abs(left_speed))
                    self.logger.info(f"✅ Moving backward at speed {abs(left_speed)} via EPuck2")
                else:
                    # Both motors stopped
                    self.pipuck.epuck.set_motor_speeds(0, 0)
                    self.logger.info("✅ Motors stopped via EPuck2")
            elif left_speed == -right_speed:
                if left_speed < 0:
                    # Left negative, right positive - turn left
                    self.pipuck.epuck.turn_left(abs(right_speed))
                    self.logger.info(f"✅ Turning left at speed {abs(right_speed)} via EPuck2")
                else:
                    # Left positive, right negative - turn right
                    self.pipuck.epuck.turn_right(abs(left_speed))
                    self.logger.info(f"✅ Turning right at speed {abs(left_speed)} via EPuck2")
            else:
                # Complex movement - use direct motor speeds
                self.pipuck.epuck.set_motor_speeds(left_speed, right_speed)
                self.logger.info(f"✅ Custom motor speeds set via EPuck2: left={left_speed}%, right={right_speed}%")

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

    @property
    def is_initialized(self) -> bool:
        """Check if motor controller is initialized"""
        return self._initialized
