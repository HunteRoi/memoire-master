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
    accelerometer: List[float]
    gyroscope: List[float]
    microphone: float
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()


@dataclass
class MotorCommand:
    """Motor control command"""
    action: str = "set_speed"
    left_speed: Optional[float] = None
    right_speed: Optional[float] = None
    duration: Optional[float] = None  # None means indefinite


@dataclass
class LEDCommand:
    """LED control command"""
    action: str = "set_rgb"
    red: Optional[int] = None
    green: Optional[int] = None
    blue: Optional[int] = None
    enabled: Optional[bool] = None
    color: Optional[str] = None
    pattern: str = "solid"  # solid, blink, pulse, blink_fast
    duration: Optional[float] = None


@dataclass
class AudioCommand:
    """Audio playback command"""
    action: str = "play_tone"
    frequency: Optional[int] = None
    duration: float = 0.5
    volume: float = 1.0
    file_path: Optional[str] = None
    melody_name: Optional[str] = None
    sound_type: str = "tone"  # tone, beep, error, melody, file