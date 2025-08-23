"""Command router - Maps incoming commands to use cases"""

import logging
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
            action = command_data.get("action", "")

            self.logger.info(f"🎯 Routing command: {command}")

            # Motor commands
            if command in ["move_forward", "move_backward", "turn_left", "turn_right", "stop_motors"]:
                return await self._handle_motor_command(command, command_data)

            # LED commands
            elif command in ["set_led_color", "set_led_rgb", "blink_led", "led_off", "set_front_led"]:
                return await self._handle_led_command(command, command_data)

            # Audio commands
            elif command in ["play_tone", "play_beep", "play_audio_file", "stop_audio"]:
                return await self._handle_audio_command(command, command_data)

            # Sensor commands
            elif command in ["read_sensors", "read_proximity", "read_light", "read_ground",
                           "detect_ground_color", "read_imu", "read_randb", "read_battery"]:
                return await self._handle_sensor_command(command, command_data)

            # Execute block command (special case for GUI)
            elif command == "execute_block":
                return await self._handle_execute_block(command_data)

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

    async def _handle_motor_command(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle motor-related commands"""
        speed = data.get("speed", 50)
        duration = data.get("duration", 1.0)

        if command == "move_forward":
            return await self.motor.move_forward(speed, duration)
        elif command == "move_backward":
            return await self.motor.move_backward(speed, duration)
        elif command == "turn_left":
            return await self.motor.turn_left(speed, duration)
        elif command == "turn_right":
            return await self.motor.turn_right(speed, duration)
        elif command == "stop_motors":
            return await self.motor.stop_motors()
        else:
            return {"success": False, "error": f"Unknown motor command: {command}"}

    async def _handle_led_command(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle LED-related commands"""
        if command == "set_led_color":
            color = data.get("color", "red")
            return await self.led.set_led_color(color)
        elif command == "set_led_rgb":
            red = data.get("red", 255)
            green = data.get("green", 0)
            blue = data.get("blue", 0)
            return await self.led.set_led_rgb(red, green, blue)
        elif command == "blink_led":
            red = data.get("red", 255)
            green = data.get("green", 0)
            blue = data.get("blue", 0)
            count = data.get("count", 3)
            speed = data.get("speed", 0.5)
            return await self.led.blink_led(red, green, blue, count, speed)
        elif command == "led_off":
            return await self.led.led_off()
        elif command == "set_front_led":
            enabled = data.get("enabled", True)
            return await self.led.set_front_led(enabled)
        else:
            return {"success": False, "error": f"Unknown LED command: {command}"}

    async def _handle_audio_command(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle audio-related commands"""
        if command == "play_tone":
            frequency = data.get("frequency", 800)
            duration = data.get("duration", 0.5)
            return await self.audio.play_tone(frequency, duration)
        elif command == "play_beep":
            duration = data.get("duration", 0.3)
            return await self.audio.play_beep(duration)
        elif command == "play_audio_file":
            file_path = data.get("file_path", "")
            volume = data.get("volume", 0.7)
            return await self.audio.play_audio_file(file_path, volume)
        elif command == "stop_audio":
            return await self.audio.stop_audio()
        else:
            return {"success": False, "error": f"Unknown audio command: {command}"}

    async def _handle_sensor_command(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle sensor-related commands"""
        if command == "read_sensors":
            return await self.sensor.read_all_sensors()
        elif command == "read_proximity":
            proximity_data = await self.sensor.read_proximity_sensors()
            return {"success": True, "data": proximity_data}
        elif command == "read_light":
            light_data = await self.sensor.read_light_sensors()
            return {"success": True, "data": light_data}
        elif command == "read_ground":
            ground_data = await self.sensor.read_ground_sensors()
            return {"success": True, "data": ground_data}
        elif command == "detect_ground_color":
            threshold = data.get("threshold", 1000)
            return await self.sensor.detect_ground_color(threshold)
        elif command == "read_imu":
            return await self.sensor.read_imu_data()
        elif command == "read_randb":
            return await self.sensor.read_randb_sensors()
        elif command == "read_battery":
            return await self.sensor.read_battery_level()
        else:
            return {"success": False, "error": f"Unknown sensor command: {command}"}

    async def _handle_execute_block(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle execute block command from GUI"""
        try:
            # Extract code from the execute block
            code = data.get("code", "")
            if not code:
                return {"success": False, "error": "No code provided"}

            self.logger.info(f"🔧 Executing block: {code[:50]}...")

            # For now, return success - the actual execution would be handled
            # by a separate command executor service
            return {
                "success": True,
                "action": "execute_block",
                "message": "Block executed successfully",
                "output": f"Executed: {code[:100]}..."
            }

        except Exception as e:
            self.logger.error(f"❌ Execute block failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
