import asyncio
import logging
import os
import re
from typing import Dict, Any, Optional

from application.use_cases.led_use_cases import LEDUseCases
from application.use_cases.audio_use_cases import AudioUseCases
from application.use_cases.sensor_use_cases import SensorUseCases
from application.use_cases.motor_use_cases import MotorUseCases


class RobotController:
    """Robot server class."""

    def __init__(self,
                 led_use_cases: LEDUseCases,
                 audio_use_cases: AudioUseCases,
                 sensor_use_cases: SensorUseCases,
                 motor_use_cases: MotorUseCases,
                ):
        self.logger = logging.getLogger(__name__)
        self.led = led_use_cases
        self.audio = audio_use_cases
        self.sensor = sensor_use_cases
        self.motor = motor_use_cases

    async def handle_command(self, command_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle command execution business logic"""
        await self.on_command_received()

        try:
            command = command_data.get("command", "")

            self.logger.info(f"🎯 Routing command: {command}")

            parsed_command = self._parse_gui_command(command)
            if parsed_command:
                self.logger.debug(f"🔍 Parsed '{command}' -> '{parsed_command['command']}' with params: {parsed_command['params']}")
                command = parsed_command["command"]
                command_data.update(parsed_command["params"])

            self.logger.debug(f"🎯 Final command: '{command}' with data: {command_data}")

            if command in ["move_forward", "move_backward", "turn_left",
                           "turn_right", "stop_motors", "stop", "stop_motors"]:     # Motor commands
                result = await self._handle_motor_command(command, command_data)

            elif command in ["blink_leds"]:                                         # LED commands
                result = await self._handle_led_command(command, command_data)

            elif command in ["play_beep", "stop_audio", "play_melody"]:             # Audio commands
                result = await self._handle_audio_command(command, command_data)

            elif command in ["read_ground", "read_battery"]:                        # Sensor commands
                result = await self._handle_sensor_command(command, command_data)

            else:                                                                   # Unknown command
                self.logger.warning(f"❌ Unknown command: {command}")
                result = {
                    "success": False,
                    "error": f"Unknown command: {command}"
                }

        except Exception as e:
            self.logger.error(f"❌ Command execution failed: {e}")
            result = {
                "success": False,
                "error": str(e)
            }

        # Provide error feedback if command failed
        if not result.get("success", False):
            await self.on_command_error()

        return {
            "type": "success" if result.get("success", False) else "error",
            "data": result
        }

    async def handle_battery_check(self) -> Dict[str, Any]:
        """Handle battery check request"""
        battery_data = await self.sensor.read_battery_level()
        return {
            "type": "status",
            "data": battery_data
        }

    async def handle_ping(self, client_count: int = 0) -> Dict[str, Any]:
        """Handle ping request with battery and status info"""

        try:
            robot_id = os.popen("hostname -I").read().strip().split('.')[-1]
            battery_result = await self.sensor.read_battery_level()
            battery_data = battery_result.get('data', {})
            epuck_battery = battery_data.get('epuck', {})
            battery_percentage = epuck_battery.get('percentage', 0)
            battery_voltage = epuck_battery.get('voltage', 0.0)

            return {
                "type": "pong",
                "data": {
                    "timestamp": asyncio.get_event_loop().time(),
                    "battery": battery_percentage,
                    "battery_voltage": battery_voltage,
                    "status": "connected" if client_count > 0 else "idle",
                    "client_count": client_count,
                    "robot_id": robot_id,
                    "hardware": {
                        "motors": self.motor.is_initialized,
                        "leds": self.led.is_initialized,
                        "audio": self.audio.is_initialized,
                        "sensors": self.sensor.is_initialized
                    }
                }
            }
        except Exception as e:
            self.logger.warning(f"⚠️ Failed to get detailed ping info: {e}")
            # Fallback to basic ping response
            return {
                "type": "pong",
                "data": {
                    "timestamp": asyncio.get_event_loop().time(),
                    "battery": 0,
                    "status": "unknown"
                }
            }

    async def handle_status_message(self, status_data: Dict[str, Any]) -> None:
        """Handle status message from client"""
        status = status_data.get('status', 'unknown')
        if status == 'connected':
            client_name = status_data.get('client', 'unknown')
            self.logger.info(f"✅ Client '{client_name}' confirmed connection")
        elif status == 'disconnecting':
            self.logger.info(f"👋 Client gracefully disconnecting")
        else:
            self.logger.info(f"📋 Client status update: {status}")

    async def handle_client_connected(self, client_count: int = 0) -> Dict[str, Any]:
        """Handle client connection business logic"""
        self.logger.info(f"🔗 Client connected (total: {client_count})")
        await self.on_client_connected()

        try:
            ping_response = await self.handle_ping(client_count)
            ping_data = ping_response.get('data', {})

            return {
                "type": "status",
                "data": {
                    "state": "connected",
                    "firmware_version": "1.0.0",
                    **{k: v for k, v in ping_data.items() if k not in ("state", "firmware_version")}
                }
            }
        except Exception as e:
            self.logger.warning(f"⚠️ Failed to get detailed ping info: {e}")
            # Fallback to basic ping response
            return {
                "type": "pong",
                "data": {
                    "timestamp": asyncio.get_event_loop().time(),
                    "battery": 0,
                    "status": "unknown"
                }
            }

    async def handle_client_disconnected(self, client_count: int = 0) -> None:
        """Handle client disconnection business logic"""
        self.logger.info(f"🔌 Client disconnected (remaining: {client_count})")

        if client_count == 0:
            await self.on_client_disconnected()

    async def on_client_connected(self):
        """Provide feedback when client connects - LED should be BLUE when connected"""
        try:
            await self.led.set_led_color("blue")
            await self.audio.play_connect_sound()
        except Exception as e:
            self.logger.warning(f"Client connected feedback failed: {e}")

    async def on_client_disconnected(self):
        """Provide feedback when last client disconnects - LED should be GREEN when waiting"""
        try:
            await self.led.set_led_color("green")
            await self.audio.play_disconnect_sound()
        except Exception as e:
            self.logger.warning(f"Client disconnected feedback failed: {e}")

    async def on_command_received(self):
        """Provide feedback when command is received"""
        try:
            await self.led.blink_led(0, 0, 255, 2, 0.2)
        except Exception as e:
            self.logger.warning(f"Command received feedback failed: {e}")

    async def on_command_error(self):
        """Provide feedback when command fails"""
        try:
            await self.led.blink_led(255, 0, 0, 2, 0.2)
            await self.audio.play_error_sound()
        except Exception as e:
            self.logger.warning(f"Command error feedback failed: {e}")

    async def on_startup(self):
        """Provide feedback on startup - LED should be GREEN when waiting for connection"""
        try:
            await self.led.set_led_color("green")
            self.logger.info("🚀 Robot startup complete - waiting for client connection")
        except Exception as e:
            self.logger.warning(f"Startup feedback failed: {e}")

    async def on_shutdown(self):
        """Provide feedback on shutdown"""
        try:
            await self.led.led_off()
        except Exception as e:
            self.logger.warning(f"Shutdown feedback failed: {e}")

    # Private methods for command handling
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
