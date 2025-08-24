"""Application interfaces - Hardware contracts for dependency inversion"""

from .hardware import (
    MotorInterface,
    SensorInterface,
    LEDInterface,
    AudioInterface
)
__all__ = [
    'MotorInterface',
    'SensorInterface',
    'LEDInterface',
    'AudioInterface'
]
