"""Command router - Maps incoming commands to use cases"""

import logging
import re
from typing import Dict, Any, Optional

from application.use_cases.motor_use_cases import MotorUseCases
from application.use_cases.led_use_cases import LEDUseCases
from application.use_cases.audio_use_cases import AudioUseCases
from application.use_cases.sensor_use_cases import SensorUseCases


class CommandRouter:
    """Routes commands to appropriate use cases"""

    def __init__(
        self,
        motor_use_cases: MotorUseCases,
        led_use_cases: LEDUseCases,
        audio_use_cases: AudioUseCases,
        sensor_use_cases: SensorUseCases
    ):
        self.motor = motor_use_cases
        self.led = led_use_cases
        self.audio = audio_use_cases
        self.sensor = sensor_use_cases
        self.logger = logging.getLogger(__name__)

    async def execute_command(self, command_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a command based on the command data"""
        try:
            command = command_data.get("command", "")

            self.logger.info(f"🎯 Routing command: {command}")

            # Parse command if it's a function call from GUI
            parsed_command = self._parse_gui_command(command)
            if parsed_command:
                self.logger.debug(f"🔍 Parsed '{command}' -> '{parsed_command['command']}' with params: {parsed_command['params']}")
                command = parsed_command["command"]
                # Merge parsed parameters with existing data
                command_data.update(parsed_command["params"])

            self.logger.debug(f"🎯 Final command: '{command}' with data: {command_data}")

            # Motor commands
            if command in ["move_forward", "move_backward", "turn_left", "turn_right", "stop_motors", "stop", "stop_motors"]:
                return await self._handle_motor_command(command, command_data)

            # LED commands
            elif command in ["blink_leds"]:
                return await self._handle_led_command(command, command_data)

            # Audio commands
            elif command in ["play_beep", "stop_audio", "play_melody"]:
                return await self._handle_audio_command(command, command_data)

            # Sensor commands
            elif command in ["read_ground", "read_battery"]:
                return await self._handle_sensor_command(command, command_data)

            else:
                self.logger.warning(f"❌ Unknown command: {command}")
                return {
                    "success": False,
                    "error": f"Unknown command: {command}"
                }

        except Exception as e:
            self.logger.error(f"❌ Command execution failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _parse_gui_command(self, command: str) -> Optional[Dict[str, Any]]:
        """Parse GUI command format like 'move_forward(speed=50, duration=1)' to structured data"""
        try:
            # Match function call pattern: function_name(param=value, param=value)
            match = re.match(r'^(\w+)\(([^)]*)\)$', command.strip())
            if not match:
                return None

            function_name = match.group(1)
            params_str = match.group(2).strip()

            params = {}
            if params_str:
                # Parse parameters: param=value, param=value
                for param in params_str.split(','):
                    param = param.strip()
                    if '=' in param:
                        key, value = param.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"\'')
                        # Try to convert to appropriate type
                        try:
                            if '.' in value:
                                params[key] = float(value)
                            else:
                                params[key] = int(value)
                        except ValueError:
                            params[key] = value

            return {
                "command": function_name,
                "params": params
            }

        except Exception as e:
            self.logger.warning(f"Failed to parse GUI command '{command}': {e}")
            return None

    async def _handle_motor_command(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle motor-related commands"""
        speed = data.get("speed", 50)
        duration = data.get("duration", 1.0)
        angle = data.get("angle", 90)

        if command == "move_forward":
            return await self.motor.move_forward(speed, duration)
        elif command == "move_backward":
            return await self.motor.move_backward(speed, duration)
        elif command == "turn_left":
            return await self.motor.turn_left(angle, speed)
        elif command == "turn_right":
            return await self.motor.turn_right(angle, speed)
        elif command in ["stop_motors", "stop"]:
            return await self.motor.stop()
        else:
            return {"success": False, "error": f"Unknown motor command: {command}"}

    async def _handle_led_command(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle LED-related commands"""
        if command == "blink_leds":
            # Special command for multicolor LED blinking sequence
            try:
                self.logger.info("✨ Executing multicolor LED blink sequence")
                await self.led.blink_led(255, 255, 0, 3, 0.3)  # Yellow blink
                await self.led.blink_led(0, 255, 255, 3, 0.3)  # Cyan blink
                await self.led.blink_led(255, 0, 255, 3, 0.3)  # Magenta blink
                return {
                    "success": True,
                    "action": "blink_leds",
                    "message": "LED blink sequence completed"
                }
            except Exception as e:
                return {"success": False, "error": f"LED blink sequence failed: {e}"}
        else:
            return {"success": False, "error": f"Unknown LED command: {command}"}

    async def _handle_audio_command(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle audio-related commands"""
        if command == "play_beep":
            duration = data.get("duration", 0.3)
            return await self.audio.play_beep(duration)
        elif command == "stop_audio":
            return await self.audio.stop_audio()
        elif command == "play_melody":
            melody_name = data.get("melody", data.get("melody_name", "happy"))
            return await self.audio.play_melody(melody_name)
        else:
            return {"success": False, "error": f"Unknown audio command: {command}"}

    async def _handle_sensor_command(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle sensor-related commands"""
        if command == "read_ground":
            ground_data = await self.sensor.read_ground_sensors()
            return {"success": True, "data": ground_data}
        elif command == "read_battery":
            return await self.sensor.read_battery_level()
        else:
            return {"success": False, "error": f"Unknown sensor command: {command}"}
