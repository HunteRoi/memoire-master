"""E-puck2 sensor implementation using unifr-api-epuck"""

import asyncio
import logging
from typing import List, Optional
from pi_puck import PiPuck
from ..domain.interfaces import SensorInterface
from ..domain.entities import SensorReading


class EPuck2Sensors(SensorInterface):
    """E-puck2 sensor reading implementation"""
    
    def __init__(self):
        self.pi_puck: Optional[PiPuck] = None
        self.logger = logging.getLogger(__name__)
        self._initialized = False
    
    async def initialize(self) -> bool:
        """Initialize sensor hardware"""
        try:
            self.pi_puck = PiPuck()
            await asyncio.to_thread(self.pi_puck.init_sensors)
            self._initialized = True
            self.logger.info("🔬 E-puck2 sensors initialized")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize sensors: {e}")
            return False
    
    async def cleanup(self) -> None:
        """Cleanup sensor hardware"""
        if self.pi_puck and self._initialized:
            try:
                await asyncio.to_thread(self.pi_puck.cleanup_sensors)
                self.logger.info("🧹 Sensors cleaned up")
            except Exception as e:
                self.logger.error(f"❌ Error during sensor cleanup: {e}")
            finally:
                self._initialized = False
    
    async def get_proximity(self) -> List[int]:
        """Get proximity sensor readings (8 sensors)"""
        if not self._initialized:
            raise RuntimeError("Sensors not initialized")
        
        try:
            readings = await asyncio.to_thread(self.pi_puck.get_proximity)
            # Ensure we have 8 readings
            if len(readings) != 8:
                self.logger.warning(f"Expected 8 proximity readings, got {len(readings)}")
                readings = readings[:8] + [0] * (8 - len(readings))
            return list(readings)
        except Exception as e:
            self.logger.error(f"❌ Failed to read proximity sensors: {e}")
            return [0] * 8
    
    async def get_light(self) -> List[int]:
        """Get light sensor readings (8 sensors)"""
        if not self._initialized:
            raise RuntimeError("Sensors not initialized")
        
        try:
            readings = await asyncio.to_thread(self.pi_puck.get_light)
            # Ensure we have 8 readings
            if len(readings) != 8:
                self.logger.warning(f"Expected 8 light readings, got {len(readings)}")
                readings = readings[:8] + [0] * (8 - len(readings))
            return list(readings)
        except Exception as e:
            self.logger.error(f"❌ Failed to read light sensors: {e}")
            return [0] * 8
    
    async def get_accelerometer(self) -> List[float]:
        """Get accelerometer readings [x, y, z]"""
        if not self._initialized:
            raise RuntimeError("Sensors not initialized")
        
        try:
            readings = await asyncio.to_thread(self.pi_puck.get_accelerometer)
            return list(readings) if readings and len(readings) >= 3 else [0.0, 0.0, 0.0]
        except Exception as e:
            self.logger.error(f"❌ Failed to read accelerometer: {e}")
            return [0.0, 0.0, 0.0]
    
    async def get_gyroscope(self) -> List[float]:
        """Get gyroscope readings [x, y, z]"""
        if not self._initialized:
            raise RuntimeError("Sensors not initialized")
        
        try:
            readings = await asyncio.to_thread(self.pi_puck.get_gyroscope)
            return list(readings) if readings and len(readings) >= 3 else [0.0, 0.0, 0.0]
        except Exception as e:
            self.logger.error(f"❌ Failed to read gyroscope: {e}")
            return [0.0, 0.0, 0.0]
    
    async def get_microphone(self) -> float:
        """Get microphone level"""
        if not self._initialized:
            raise RuntimeError("Sensors not initialized")
        
        try:
            level = await asyncio.to_thread(self.pi_puck.get_microphone)
            return float(level) if level is not None else 0.0
        except Exception as e:
            self.logger.error(f"❌ Failed to read microphone: {e}")
            return 0.0
    
    async def get_all_readings(self) -> SensorReading:
        """Get all sensor readings at once"""
        # Get all readings concurrently for better performance
        proximity_task = asyncio.create_task(self.get_proximity())
        light_task = asyncio.create_task(self.get_light())
        accel_task = asyncio.create_task(self.get_accelerometer())
        gyro_task = asyncio.create_task(self.get_gyroscope())
        mic_task = asyncio.create_task(self.get_microphone())
        
        try:
            proximity, light, accelerometer, gyroscope, microphone = await asyncio.gather(
                proximity_task, light_task, accel_task, gyro_task, mic_task
            )
            
            return SensorReading(
                proximity=proximity,
                light=light,
                accelerometer=accelerometer,
                gyroscope=gyroscope,
                microphone=microphone
            )
        except Exception as e:
            self.logger.error(f"❌ Failed to get all sensor readings: {e}")
            # Return empty readings on error
            return SensorReading(
                proximity=[0] * 8,
                light=[0] * 8,
                accelerometer=[0.0, 0.0, 0.0],
                gyroscope=[0.0, 0.0, 0.0],
                microphone=0.0
            )