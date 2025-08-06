"""Domain interfaces (abstract base classes)"""

from abc import ABC, abstractmethod
from typing import List, Optional
from .entities import RobotState, SensorReading, MotorCommand, LEDCommand, AudioCommand


class HardwareInterface(ABC):
    """Base interface for all hardware components"""
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the hardware component"""
        pass
    
    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup the hardware component"""
        pass


class MotorInterface(HardwareInterface):
    """Interface for motor control"""
    
    @abstractmethod
    async def set_speed(self, left_speed: float, right_speed: float) -> None:
        """Set motor speeds (-100 to 100)"""
        pass
    
    @abstractmethod
    async def stop(self) -> None:
        """Stop both motors"""
        pass
    
    @abstractmethod
    async def execute_command(self, command: MotorCommand) -> None:
        """Execute a motor command"""
        pass


class SensorInterface(HardwareInterface):
    """Interface for sensor reading"""
    
    @abstractmethod
    async def get_proximity(self) -> List[int]:
        """Get proximity sensor readings (8 sensors)"""
        pass
    
    @abstractmethod
    async def get_light(self) -> List[int]:
        """Get light sensor readings (8 sensors)"""
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
    async def get_microphone(self) -> float:
        """Get microphone level"""
        pass
    
    @abstractmethod
    async def get_all_readings(self) -> SensorReading:
        """Get all sensor readings at once"""
        pass


class LEDInterface(HardwareInterface):
    """Interface for LED control"""
    
    @abstractmethod
    async def set_color(self, color: str, pattern: str = "solid") -> None:
        """Set LED color and pattern"""
        pass
    
    @abstractmethod
    async def set_body_led(self, red: int, green: int, blue: int) -> None:
        """Set body LED RGB values (0-255)"""
        pass
    
    @abstractmethod
    async def set_front_led(self, enabled: bool) -> None:
        """Enable/disable front LED"""
        pass
    
    @abstractmethod
    async def execute_command(self, command: LEDCommand) -> None:
        """Execute an LED command"""
        pass


class AudioInterface(HardwareInterface):
    """Interface for audio playback"""
    
    @abstractmethod
    async def play_tone(self, frequency: int, duration: float, volume: float = 1.0) -> None:
        """Play a tone"""
        pass
    
    @abstractmethod
    async def play_beep(self, duration: float = 0.1) -> None:
        """Play a simple beep"""
        pass
    
    @abstractmethod
    async def play_error_sound(self) -> None:
        """Play error sound sequence"""
        pass
    
    @abstractmethod
    async def execute_command(self, command: AudioCommand) -> None:
        """Execute an audio command"""
        pass


class StateManagerInterface(ABC):
    """Interface for robot state management"""
    
    @abstractmethod
    async def get_state(self) -> RobotState:
        """Get current robot state"""
        pass
    
    @abstractmethod
    async def set_state(self, state: RobotState) -> None:
        """Set robot state and update indicators"""
        pass
    
    @abstractmethod
    async def can_transition_to(self, new_state: RobotState) -> bool:
        """Check if transition to new state is allowed"""
        pass


class CommandExecutorInterface(ABC):
    """Interface for executing Python commands safely"""
    
    @abstractmethod
    async def execute(self, command: str) -> str:
        """Execute a Python command and return result"""
        pass
    
    @abstractmethod
    def get_safe_globals(self) -> dict:
        """Get safe global variables for command execution"""
        pass