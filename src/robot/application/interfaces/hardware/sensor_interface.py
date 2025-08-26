"""Sensor hardware interface"""

from abc import ABC, abstractmethod
from typing import List

from domain.entities import SensorReading


class SensorInterface(ABC):
    """Interface for sensor reading"""

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the hardware component"""
        pass

    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup the hardware component"""
        pass

    @abstractmethod
    async def get_proximity(self) -> List[int]:
        """Get proximity sensor readings (8 sensors)"""
        pass

    @abstractmethod
    async def get_light(self) -> List[int]:
        """Get light sensor readings (8 sensors)"""
        pass

    @abstractmethod
    async def get_magnetometer(self) -> List[float]:
        """Get magnetometer readings [x, y, z]"""
        pass

    @abstractmethod
    async def get_accelerometer(self) -> List[float]:
        """Get accelerometer readings [x, y, z]"""
        pass

    @abstractmethod
    async def get_gyroscope(self) -> List[float]:
        """Get gyroscope readings [x, y, z]"""
        pass

    @abstractmethod
    async def get_ground_sensors(self) -> List[int]:
        """Get ground sensors readings [left, center, right]"""
        pass

    @abstractmethod
    async def get_all_readings(self) -> SensorReading:
        """Get all sensor readings at once"""
        pass

    @abstractmethod
    async def get_battery_level(self) -> dict:
        """Get battery level information"""
        pass
