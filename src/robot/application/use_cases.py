"""Use cases for robot operations"""

from typing import Dict, Any
import asyncio
from ..domain.entities import RobotState, MotorCommand, LEDCommand, AudioCommand
from ..domain.interfaces import (
    StateManagerInterface,
    CommandExecutorInterface,
    MotorInterface,
    LEDInterface,
    AudioInterface
)


class CommandExecutor:
    """Use case for executing safe Python commands"""
    
    def __init__(
        self,
        motor: MotorInterface,
        leds: LEDInterface,
        audio: AudioInterface,
        sensors
    ):
        self.motor = motor
        self.leds = leds
        self.audio = audio
        self.sensors = sensors
    
    def get_safe_globals(self) -> Dict[str, Any]:
        """Get safe global variables for command execution"""
        return {
            # Hardware interfaces
            'motors': self.motor,
            'leds': self.leds,
            'audio': self.audio,
            'sensors': self.sensors,
            
            # Safe built-ins
            'sleep': asyncio.sleep,
            'range': range,
            'len': len,
            'str': str,
            'int': int,
            'float': float,
            'list': list,
            'dict': dict,
            'print': print,
            
            # Math operations
            'abs': abs,
            'min': min,
            'max': max,
            'round': round,
            
            # Common constants
            'True': True,
            'False': False,
            'None': None,
        }
    
    async def execute(self, command: str) -> str:
        """Execute Python command safely"""
        if not command.strip():
            raise ValueError("Empty command")
        
        # Create safe execution environment
        safe_globals = self.get_safe_globals()
        safe_locals = {}
        
        try:
            # Handle async/await commands
            if 'await ' in command:
                # Wrap in async function for execution
                wrapped_command = f"""
async def _execute_command():
    return {command.strip()}
                
result = await _execute_command()
"""
                exec(wrapped_command, safe_globals, safe_locals)
                result = safe_locals.get('result')
            else:
                # Execute sync command
                result = eval(command, safe_globals, safe_locals)
            
            return str(result) if result is not None else "Command executed successfully"
            
        except Exception as e:
            raise RuntimeError(f"Command execution failed: {str(e)}")


class StateManager:
    """Use case for managing robot state"""
    
    def __init__(self, leds: LEDInterface, audio: AudioInterface):
        self.leds = leds
        self.audio = audio
        self._current_state = RobotState.IDLE
    
    async def get_state(self) -> RobotState:
        """Get current robot state"""
        return self._current_state
    
    async def set_state(self, state: RobotState) -> None:
        """Set robot state and update indicators"""
        if self._current_state == state:
            return
        
        if not await self.can_transition_to(state):
            raise ValueError(f"Invalid state transition from {self._current_state} to {state}")
        
        self._current_state = state
        await self._update_indicators(state)
    
    async def can_transition_to(self, new_state: RobotState) -> bool:
        """Check if state transition is valid"""
        # Define valid transitions
        valid_transitions = {
            RobotState.IDLE: [RobotState.CONNECTED, RobotState.ERROR],
            RobotState.CONNECTED: [RobotState.IDLE, RobotState.RUNNING, RobotState.ERROR],
            RobotState.RUNNING: [RobotState.CONNECTED, RobotState.PAUSED, RobotState.ERROR],
            RobotState.PAUSED: [RobotState.RUNNING, RobotState.CONNECTED, RobotState.ERROR],
            RobotState.ERROR: [RobotState.IDLE, RobotState.CONNECTED]
        }
        
        allowed = valid_transitions.get(self._current_state, [])
        return new_state in allowed
    
    async def _update_indicators(self, state: RobotState) -> None:
        """Update LEDs and sound based on state"""
        try:
            if state == RobotState.IDLE:
                await self.leds.set_color("blue", "pulse")
                await self.audio.play_tone(440, 0.1)  # A note
                
            elif state == RobotState.CONNECTED:
                await self.leds.set_color("green", "solid")
                await self.audio.play_tone(554, 0.1)  # C# note
                
            elif state == RobotState.RUNNING:
                await self.leds.set_color("yellow", "blink")
                await self.audio.play_tone(659, 0.15)  # E note
                
            elif state == RobotState.PAUSED:
                await self.leds.set_color("orange", "pulse")
                
            elif state == RobotState.ERROR:
                await self.leds.set_color("red", "blink_fast")
                await self.audio.play_error_sound()
                
        except Exception as e:
            # Don't let indicator updates break state changes
            import logging
            logging.getLogger(__name__).warning(f"⚠️  Failed to update indicators: {e}")


class HealthMonitor:
    """Use case for monitoring robot health"""
    
    def __init__(self, sensors, state_manager: StateManager):
        self.sensors = sensors
        self.state_manager = state_manager
        self._monitoring = False
    
    async def start_monitoring(self, interval: float = 5.0):
        """Start health monitoring"""
        self._monitoring = True
        while self._monitoring:
            try:
                await self._check_health()
                await asyncio.sleep(interval)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"❌ Health check failed: {e}")
                await asyncio.sleep(interval)
    
    def stop_monitoring(self):
        """Stop health monitoring"""
        self._monitoring = False
    
    async def _check_health(self) -> Dict[str, Any]:
        """Perform health check"""
        try:
            # Check sensors are responsive
            sensors = await self.sensors.get_all_readings()
            
            # Basic health checks
            health_status = {
                "sensors_ok": all(reading >= 0 for reading in sensors.proximity),
                "timestamp": sensors.timestamp,
                "status": "healthy"
            }
            
            return health_status
            
        except Exception as e:
            # Set error state if health check fails
            await self.state_manager.set_state(RobotState.ERROR)
            raise