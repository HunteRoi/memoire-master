"""Sensor use cases - Application layer business logic"""

import asyncio
import logging
from typing import Dict, Any, List

from application.interfaces.hardware.sensor_interface import SensorInterface


class SensorUseCases:
    """Sensor use cases implementation"""
    
    def __init__(self, sensor_interface: SensorInterface):
        self.sensor = sensor_interface
        self.logger = logging.getLogger(__name__)
        self._initialized = False
    
    async def _ensure_initialized(self) -> bool:
        """Ensure sensor is initialized"""
        if not self._initialized:
            self._initialized = await self.sensor.initialize()
        return self._initialized
    
    async def read_all_sensors(self) -> Dict[str, Any]:
        """Read all robot sensors"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Sensors not initialized"
                }
            
            self.logger.info("📡 Reading all sensors")
            
            # Get comprehensive sensor data
            sensor_data = await self.sensor.get_all_readings()
            
            return {
                "success": True,
                "action": "read_all_sensors",
                "data": {
                    "proximity": sensor_data.proximity,
                    "light": sensor_data.light,
                    "accelerometer": sensor_data.accelerometer,
                    "gyroscope": sensor_data.gyroscope,
                    "microphone": sensor_data.microphone,
                    "timestamp": sensor_data.timestamp
                }
            }
            
        except Exception as e:
            self.logger.error(f"❌ Read all sensors failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def read_proximity_sensors(self) -> List[int]:
        """Read proximity sensors"""
        try:
            if not await self._ensure_initialized():
                return [0] * 8
            
            return await self.sensor.get_proximity()
            
        except Exception as e:
            self.logger.error(f"❌ Read proximity sensors failed: {e}")
            return [0] * 8
    
    async def read_light_sensors(self) -> List[int]:
        """Read light sensors"""
        try:
            if not await self._ensure_initialized():
                return [100] * 8
            
            return await self.sensor.get_light()
            
        except Exception as e:
            self.logger.error(f"❌ Read light sensors failed: {e}")
            return [100] * 8
    
    async def read_ground_sensors(self) -> List[int]:
        """Read ground sensors"""
        try:
            if not await self._ensure_initialized():
                return [0, 0, 0]
            
            # Note: This would need to be added to domain interface
            # For now, return mock data
            return [1000, 1000, 1000]  # Mock ground sensor data
            
        except Exception as e:
            self.logger.error(f"❌ Read ground sensors failed: {e}")
            return [0, 0, 0]
    
    async def detect_ground_color(self, threshold: int = 1000) -> Dict[str, Any]:
        """Detect ground color changes (white tiles on black background)"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Sensors not initialized"
                }
            
            threshold = max(100, min(5000, threshold))
            
            self.logger.info(f"🔍 Detecting ground colors with threshold {threshold}")
            
            # Get ground sensor readings
            ground_readings = await self.read_ground_sensors()
            
            # Analyze each sensor
            detection_result = {
                "left": {
                    "value": ground_readings[0],
                    "color": "white" if ground_readings[0] > threshold else "black",
                    "is_light": ground_readings[0] > threshold
                },
                "center": {
                    "value": ground_readings[1], 
                    "color": "white" if ground_readings[1] > threshold else "black",
                    "is_light": ground_readings[1] > threshold
                },
                "right": {
                    "value": ground_readings[2],
                    "color": "white" if ground_readings[2] > threshold else "black", 
                    "is_light": ground_readings[2] > threshold
                }
            }
            
            # Summary detection
            light_count = sum(1 for pos in detection_result.values() if pos["is_light"])
            detection_result["summary"] = {
                "light_sensors": light_count,
                "dark_sensors": 3 - light_count,
                "all_light": light_count == 3,
                "all_dark": light_count == 0,
                "mixed": 0 < light_count < 3
            }
            
            return {
                "success": True,
                "action": "detect_ground_color",
                "threshold": threshold,
                "data": detection_result
            }
            
        except Exception as e:
            self.logger.error(f"❌ Ground color detection failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def read_imu_data(self) -> Dict[str, Any]:
        """Read IMU sensor data (accelerometer + gyroscope)"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Sensors not initialized"
                }
            
            # Get accelerometer and gyroscope data
            accel = await self.sensor.get_accelerometer()
            gyro = await self.sensor.get_gyroscope()
            
            return {
                "success": True,
                "action": "read_imu_data",
                "data": {
                    "accelerometer": {
                        "x": accel[0],
                        "y": accel[1],
                        "z": accel[2]
                    },
                    "gyroscope": {
                        "x": gyro[0],
                        "y": gyro[1],
                        "z": gyro[2]
                    }
                }
            }
            
        except Exception as e:
            self.logger.error(f"❌ Read IMU data failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def read_randb_sensors(self) -> Dict[str, Any]:
        """Read range and bearing sensors"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Sensors not initialized"
                }
            
            self.logger.info("📡 Reading range and bearing sensors")
            
            # Note: This would need to be added to domain interface
            # For now, return mock data
            randb_data = {
                "data_available": False,
                "sensors": []
            }
            
            return {
                "success": True,
                "action": "read_randb_sensors",
                "data": randb_data
            }
            
        except Exception as e:
            self.logger.error(f"❌ Read randb sensors failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def read_battery_level(self) -> Dict[str, Any]:
        """Read battery level"""
        try:
            if not await self._ensure_initialized():
                return {
                    "success": False,
                    "error": "Sensors not initialized"
                }
            
            # Get actual battery information from sensor controller
            battery_info = await self.sensor.get_battery_level()
            
            return {
                "success": True,
                "action": "read_battery_level",
                "data": battery_info
            }
            
        except Exception as e:
            self.logger.error(f"❌ Read battery level failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }