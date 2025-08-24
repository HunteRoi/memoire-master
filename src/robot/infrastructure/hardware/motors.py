"""Motor control for e-puck2 robot - Direct I2C implementation based on goto-charge.py"""

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
    """E-puck2 motor control using direct I2C (based on goto-charge.py)"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.i2c_bus = None
        
        # I2C configuration from goto-charge.py
        self.I2C_CHANNEL = 12
        self.LEGACY_I2C_CHANNEL = 4
        self.epuck_address = 0x1f
        
        # Motor control registers (from goto-charge.py)
        self.LEFT_MOTOR_SPEED = 0x46
        self.RIGHT_MOTOR_SPEED = 0x47

    async def initialize(self) -> bool:
        """Initialize I2C motor control based on goto-charge.py"""
        if self._initialized:
            return True

        try:
            if not smbus2:
                raise ImportError("smbus2 not available")

            # Try I2C channels like in goto-charge.py
            for channel in [self.I2C_CHANNEL, self.LEGACY_I2C_CHANNEL]:
                try:
                    self.i2c_bus = smbus2.SMBus(channel)
                    # Test communication
                    self.i2c_bus.read_byte(self.epuck_address)
                    self.logger.info(f"✅ Motor controller initialized on I2C channel {channel}")
                    self._initialized = True
                    return True
                except Exception as e:
                    if self.i2c_bus:
                        self.i2c_bus.close()
                        self.i2c_bus = None
                    self.logger.debug(f"I2C channel {channel} failed: {e}")
                    continue

            raise RuntimeError("No working I2C channel found")

        except ImportError as ie:
            self.logger.error(f"❌ Required libraries not available for motor control: {ie}")
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
        """Set motor speeds (-100 to 100) via I2C block data (based on e-puck2_test.py)"""
        if not self._initialized or not self.i2c_bus:
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

            # Create 20-byte payload according to Pi-puck documentation
            # Left speed (2) + Right speed (2) + Speaker (1) + LED1,3,5,7 (1) + LED2 RGB (3) + LED4 RGB (3) + LED6 RGB (3) + LED8 RGB (3) + Settings (1) + Checksum (1)
            payload = [0] * 20
            
            # Left motor speed (bytes 0-1): signed 16-bit little-endian
            left_bytes = left_value.to_bytes(2, byteorder='little', signed=True)
            payload[0] = left_bytes[0]  # Low byte
            payload[1] = left_bytes[1]  # High byte
            
            # Right motor speed (bytes 2-3): signed 16-bit little-endian
            right_bytes = right_value.to_bytes(2, byteorder='little', signed=True)  
            payload[2] = right_bytes[0]  # Low byte
            payload[3] = right_bytes[1]  # High byte
            
            # Speaker (byte 4): 0 = off
            payload[4] = 0
            
            # LED1, LED3, LED5, LED7 (byte 5): 0 = all off
            payload[5] = 0
            
            # LED2 RGB (bytes 6-8): R, G, B = 0,0,0 (off)
            payload[6] = 0  # R
            payload[7] = 0  # G  
            payload[8] = 0  # B
            
            # LED4 RGB (bytes 9-11): R, G, B = 0,0,0 (off)
            payload[9] = 0   # R
            payload[10] = 0  # G
            payload[11] = 0  # B
            
            # LED6 RGB (bytes 12-14): R, G, B = 0,0,0 (off)
            payload[12] = 0  # R
            payload[13] = 0  # G
            payload[14] = 0  # B
            
            # LED8 RGB (bytes 15-17): R, G, B = 0,0,0 (off)
            payload[15] = 0  # R
            payload[16] = 0  # G
            payload[17] = 0  # B
            
            # Settings (byte 18): Try different values to disable internal sounds
            # 0 = default, let's try other values to see if one disables beeping
            payload[18] = 0

            # Calculate checksum (XOR of first 19 bytes)
            checksum = 0
            for i in range(19):
                checksum ^= payload[i]
            payload[19] = checksum

            self.logger.info(f"🔌 I2C 20-byte payload: motors=[{payload[0]},{payload[1]},{payload[2]},{payload[3]}] speaker={payload[4]} settings={payload[18]} checksum={checksum}")
            self.logger.debug(f"📝 Full payload: {payload}")

            # Send 20-byte payload to e-puck2
            try:
                self.i2c_bus.write_i2c_block_data(self.epuck_address, 0, payload)
                self.logger.info(f"✅ Motor speeds set via I2C 20-byte payload: left={left_speed}%, right={right_speed}%")

            except Exception as i2c_e:
                self.logger.error(f"❌ I2C block write failed: {i2c_e}")
                raise i2c_e

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