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
        """Set motor speeds (-100 to 100) using EPuck2 class"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            raise RuntimeError("Motor controller not initialized")

        try:
            # Clamp speeds to valid range
            left_speed = max(-100, min(100, left_speed))
            right_speed = max(-100, min(100, right_speed))

            # Convert from percentage to e-puck2 speed values (signed 16-bit)
            # e-puck2 expects values like -1000 to 1000
            # NOTE: Motors are reversed - negate values to fix forward/backward
            left_value = int(-left_speed * 10)
            right_value = int(-right_speed * 10)

            self.logger.info(f"🚗 Setting motor speeds: left={left_speed}% ({left_value}), right={right_speed}% ({right_value})")

            # Use PiPuck EPuck2 class to set motor speeds
            self.pipuck.epuck.set_motor_speeds(left_value, right_value)

            self.logger.info(f"✅ Motor speeds set via PiPuck EPuck2: left={left_speed}%, right={right_speed}%")

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
