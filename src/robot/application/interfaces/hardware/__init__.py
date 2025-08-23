"""Hardware interfaces for dependency inversion"""

from .motor_interface import MotorInterface
from .sensor_interface import SensorInterface
from .led_interface import LEDInterface
from .audio_interface import AudioInterface

__all__ = [
    'MotorInterface',
    'SensorInterface', 
    'LEDInterface',
    'AudioInterface'
]