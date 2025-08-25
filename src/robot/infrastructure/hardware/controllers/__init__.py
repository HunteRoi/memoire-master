"""Hardware modules for e-puck2 robot - modular by concern"""

# Import main modules
from .motors import MotorController
from .audio import AudioController
from .leds import LEDController
from .sensors import SensorController

__all__ = [
    'MotorController',
    'AudioController',
    'LEDController',
    'SensorController'
]
