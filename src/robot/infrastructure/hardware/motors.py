"""Motor control for e-puck2 robot - GPIO + PWM implementation"""

import asyncio
import logging
from typing import Optional
from application.interfaces.hardware.motor_interface import MotorInterface
from domain.entities import MotorCommand


class MotorController(MotorInterface):
    """E-puck2 motor control using direct GPIO"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.motor_pins = {}
        self.pwm_left = None
        self.pwm_right = None
    
    async def initialize(self) -> bool:
        """Initialize GPIO motor control"""
        if self._initialized:
            return True
            
        try:
            import RPi.GPIO as GPIO
            
            # Setup GPIO mode
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            
            # E-puck2 motor control pins (via Pi-puck extension)
            self.motor_pins = {
                'left_forward': 18,   # Left motor forward
                'left_backward': 19,  # Left motor backward  
                'right_forward': 20,  # Right motor forward
                'right_backward': 21, # Right motor backward
                'enable_left': 12,    # PWM enable for left motor
                'enable_right': 13    # PWM enable for right motor
            }
            
            # Setup all motor control pins
            for pin_name, pin_num in self.motor_pins.items():
                GPIO.setup(pin_num, GPIO.OUT)
                GPIO.output(pin_num, GPIO.LOW)
            
            # Setup PWM for motor speed control
            self.pwm_left = GPIO.PWM(self.motor_pins['enable_left'], 1000)  # 1kHz
            self.pwm_right = GPIO.PWM(self.motor_pins['enable_right'], 1000)
            self.pwm_left.start(0)
            self.pwm_right.start(0)
            
            self._initialized = True
            self.logger.info("✅ Motor controller initialized")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Motor controller initialization failed: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup motor resources"""
        if self._initialized:
            try:
                import RPi.GPIO as GPIO
                # Stop PWM
                if self.pwm_left:
                    self.pwm_left.stop()
                if self.pwm_right:
                    self.pwm_right.stop()
                # Clean up GPIO
                GPIO.cleanup()
                self.logger.info("🧹 Motor controller cleaned up")
            except Exception as e:
                self.logger.error(f"❌ Error during motor cleanup: {e}")
        
        self._initialized = False
    
    async def set_speed(self, left_speed: float, right_speed: float) -> None:
        """Set motor speeds (-100 to 100)"""
        if not self._initialized:
            raise RuntimeError("Motor controller not initialized")
        
        try:
            import RPi.GPIO as GPIO
            
            # Clamp speeds to valid range
            left_speed = max(-100, min(100, left_speed))
            right_speed = max(-100, min(100, right_speed))
            
            # Set left motor direction and speed
            if left_speed > 0:
                GPIO.output(self.motor_pins['left_forward'], GPIO.HIGH)
                GPIO.output(self.motor_pins['left_backward'], GPIO.LOW)
                self.pwm_left.ChangeDutyCycle(abs(left_speed))
            elif left_speed < 0:
                GPIO.output(self.motor_pins['left_forward'], GPIO.LOW)
                GPIO.output(self.motor_pins['left_backward'], GPIO.HIGH)
                self.pwm_left.ChangeDutyCycle(abs(left_speed))
            else:
                GPIO.output(self.motor_pins['left_forward'], GPIO.LOW)
                GPIO.output(self.motor_pins['left_backward'], GPIO.LOW)
                self.pwm_left.ChangeDutyCycle(0)
            
            # Set right motor direction and speed
            if right_speed > 0:
                GPIO.output(self.motor_pins['right_forward'], GPIO.HIGH)
                GPIO.output(self.motor_pins['right_backward'], GPIO.LOW)
                self.pwm_right.ChangeDutyCycle(abs(right_speed))
            elif right_speed < 0:
                GPIO.output(self.motor_pins['right_forward'], GPIO.LOW)
                GPIO.output(self.motor_pins['right_backward'], GPIO.HIGH)
                self.pwm_right.ChangeDutyCycle(abs(right_speed))
            else:
                GPIO.output(self.motor_pins['right_forward'], GPIO.LOW)
                GPIO.output(self.motor_pins['right_backward'], GPIO.LOW)
                self.pwm_right.ChangeDutyCycle(0)
            
            self.logger.debug(f"🚗 Motors set - Left: {left_speed}%, Right: {right_speed}%")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to set motor speeds: {e}")
            raise
    
    async def stop(self) -> None:
        """Stop both motors"""
        await self.set_speed(0, 0)
        self.logger.debug("🛑 Motors stopped")
    
    async def execute_command(self, command: MotorCommand) -> None:
        """Execute a motor command"""
        if command.action == "move":
            await self.set_speed(command.left_speed or 0, command.right_speed or 0)
            if command.duration and command.duration > 0:
                await asyncio.sleep(command.duration)
                await self.stop()
        elif command.action == "stop":
            await self.stop()
        else:
            self.logger.warning(f"Unknown motor command: {command.action}")
    
    @property
    def is_initialized(self) -> bool:
        """Check if motor controller is initialized"""
        return self._initialized