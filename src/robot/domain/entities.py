"""Domain entities for the robot system"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
import time


class RobotState(Enum):
    """Robot operational states"""
    IDLE = "idle"
    CONNECTED = "connected"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"


class MessageType(Enum):
    """WebSocket message types"""
    COMMAND = "command"
    PING = "ping"
    STATUS = "status"
    SUCCESS = "success"
    ERROR = "error"
    PONG = "pong"


@dataclass
class RobotMessage:
    """Incoming message from client"""
    type: MessageType
    data: Dict[str, Any]
    timestamp: float = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()


@dataclass
class RobotResponse:
    """Outgoing response to client"""
    type: MessageType
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    timestamp: float = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = {
            "type": self.type.value,
            "timestamp": self.timestamp
        }
        if self.data is not None:
            result["data"] = self.data
        if self.message is not None:
            result["message"] = self.message
        return result


@dataclass
class SensorReading:
    """Sensor data from robot"""
    proximity: List[int]
    light: List[int]
    magnetometer: List[float]
    accelerometer: List[float]
    gyroscope: List[float]
    ground: List[int]
    timestamp: float = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
