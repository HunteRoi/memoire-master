"""Application interfaces - Hardware contracts for dependency inversion"""

from .hardware import (
    MotorInterface,
    SensorInterface,
    LEDInterface,
    AudioInterface
)
from .message_handler import MessageHandlerInterface
from .notification_service import NotificationServiceInterface

__all__ = [
    'MotorInterface',
    'SensorInterface',
    'LEDInterface',
    'AudioInterface',
    'MessageHandlerInterface',
    'NotificationServiceInterface'
]
