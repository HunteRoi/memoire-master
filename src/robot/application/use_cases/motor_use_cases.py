"""Motor use cases - Application layer business logic"""

import asyncio
import logging
from typing import Dict, Any

from application.interfaces.hardware.motor_interface import MotorInterface


class MotorUseCases:
    """Motor use cases implementation"""

    def __init__(self, motor_interface: MotorInterface):
        self.motor = motor_interface
        self.logger = logging.getLogger(__name__)
        self._initialized = False

    @property
    def is_initialized(self) -> bool:
        """Check if motor is initialized"""
        return self._initialized

    async def _ensure_initialized(self) -> bool:
        """Ensure motor is initialized"""
        if not self._initialized:
            self._initialized = await self.motor.initialize()
        return self._initialized

    async def move_forward(self, speed: float, duration: float) -> Dict[str, Any]:
        """Move robot forward at specified speed for duration"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Motor not initialized"
                }

            # Validate parameters
            speed = max(0, min(100, speed))
            duration = max(0.1, min(10.0, duration))

            self.logger.info(f"🚗 Moving forward: speed={speed}%, duration={duration}s")

            # Set both motors to same speed for forward movement
            await self.motor.set_speed(speed, speed)
            await asyncio.sleep(duration)
            await self.motor.stop()

            return {
                "success": True,
                "action": "move_forward",
                "speed": speed,
                "duration": duration
            }

        except Exception as e:
            self.logger.error(f"❌ Move forward failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def move_backward(self, speed: float, duration: float) -> Dict[str, Any]:
        """Move robot backward at specified speed for duration"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Motor not initialized"
                }

            # Validate parameters
            speed = max(0, min(100, speed))
            duration = max(0.1, min(10.0, duration))

            self.logger.info(f"🚗 Moving backward: speed={speed}%, duration={duration}s")

            # Set both motors to negative speed for backward movement
            await self.motor.set_speed(-speed, -speed)
            await asyncio.sleep(duration)
            await self.motor.stop()

            return {
                "success": True,
                "action": "move_backward",
                "speed": speed,
                "duration": duration
            }

        except Exception as e:
            self.logger.error(f"❌ Move backward failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def turn_left(self, angle: float, speed: float = 50) -> Dict[str, Any]:
        """Turn robot left by specified angle"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Motor not initialized"
                }

            # Validate parameters
            angle = max(0, min(360, angle))
            speed = max(10, min(100, speed))

            # Calculate duration based on angle (approximate)
            duration = angle / 90.0 * 1.5  # Rough estimate: 90 degrees = 1.5 seconds at medium speed

            self.logger.info(f"🚗 Turning left: angle={angle}°, speed={speed}%")

            # Turn left: left motor forward, right motor backward (adjusted for motor negation)
            await self.motor.set_speed(speed, -speed)
            await asyncio.sleep(duration)
            await self.motor.stop()

            return {
                "success": True,
                "action": "turn_left",
                "angle": angle,
                "speed": speed,
                "duration": duration
            }

        except Exception as e:
            self.logger.error(f"❌ Turn left failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def turn_right(self, angle: float, speed: float = 50) -> Dict[str, Any]:
        """Turn robot right by specified angle"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Motor not initialized"
                }

            # Validate parameters
            angle = max(0, min(360, angle))
            speed = max(10, min(100, speed))

            # Calculate duration based on angle (approximate)
            duration = angle / 90.0 * 1.5  # Rough estimate: 90 degrees = 1.5 seconds at medium speed

            self.logger.info(f"🚗 Turning right: angle={angle}°, speed={speed}%")

            # Turn right: left motor backward, right motor forward (adjusted for motor negation)
            await self.motor.set_speed(-speed, speed)
            await asyncio.sleep(duration)
            await self.motor.stop()

            return {
                "success": True,
                "action": "turn_right",
                "angle": angle,
                "speed": speed,
                "duration": duration
            }

        except Exception as e:
            self.logger.error(f"❌ Turn right failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def stop(self) -> Dict[str, Any]:
        """Stop robot movement"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Motor not initialized"
                }

            self.logger.info("🛑 Stopping robot")

            await self.motor.stop()

            return {
                "success": True,
                "action": "stop"
            }

        except Exception as e:
            self.logger.error(f"❌ Stop failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def set_motor_speeds(self, left_speed: float, right_speed: float) -> Dict[str, Any]:
        """Set individual motor speeds"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Motor not initialized"
                }

            # Validate parameters
            left_speed = max(-100, min(100, left_speed))
            right_speed = max(-100, min(100, right_speed))

            self.logger.info(f"🚗 Setting motor speeds: left={left_speed}%, right={right_speed}%")

            await self.motor.set_speed(left_speed, right_speed)

            return {
                "success": True,
                "action": "set_motor_speeds",
                "left_speed": left_speed,
                "right_speed": right_speed
            }

        except Exception as e:
            self.logger.error(f"❌ Set motor speeds failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
