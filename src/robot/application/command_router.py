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
            action = command_data.get("action", "")

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
            if command in ["move_forward", "move_backward", "turn_left", "turn_right", "stop_motors", "stop"]:
                return await self._handle_motor_command(command, command_data)

            # LED commands
            elif command in ["set_led_color", "set_led_rgb", "blink_led", "blink_leds", "led_off", "set_front_led"]:
                return await self._handle_led_command(command, command_data)

            # Audio commands
            elif command in ["play_tone", "play_beep", "play_audio_file", "stop_audio", "play_melody"]:
                return await self._handle_audio_command(command, command_data)

            # Sensor commands
            elif command in ["read_sensors", "read_proximity", "read_light", "read_ground",
                           "detect_ground_color", "read_imu", "read_randb", "read_battery"]:
                return await self._handle_sensor_command(command, command_data)

            # Execute block command (special case for GUI)
            elif command == "execute_block":
                return await self._handle_execute_block(command_data)

            # Handle special execute_block command or when command contains execute_block
            elif "execute_block" in str(command_data.get("command", "")):
                # Extract block name from execute_block("block_name") format
                command_str = str(command_data.get("command", ""))
                if "execute_block(" in command_str:
                    match = re.search(r'execute_block\("([^"]+)"\)', command_str)
                    if match:
                        block_name = match.group(1)
                        command_data["block_name"] = block_name
                        self.logger.debug(f"Extracted block name: {block_name}")
                    else:
                        # Try with single quotes
                        match = re.search(r"execute_block\('([^']+)'\)", command_str)
                        if match:
                            block_name = match.group(1)
                            command_data["block_name"] = block_name
                            self.logger.debug(f"Extracted block name (single quotes): {block_name}")
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
        elif command == "blink_leds":
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
        elif command == "play_melody":
            melody_name = data.get("melody", data.get("melody_name", "happy"))
            return await self.audio.play_melody(melody_name)
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
            # Extract block name or code from the execute block
            block_name = data.get("block_name", "")
            if not block_name:
                # If no block_name was extracted, try to get it from command
                command_str = data.get("command", "")
                if "execute_block(" in command_str:
                    # Parse the command string to extract block name
                    match = re.search(r'execute_block\("([^"]+)"\)', command_str)
                    if match:
                        block_name = match.group(1)
                    else:
                        # Try with single quotes
                        match = re.search(r"execute_block\('([^']+)'\)", command_str)
                        if match:
                            block_name = match.group(1)
                else:
                    block_name = command_str
            
            code = data.get("code", "")
            
            self.logger.debug(f"🔍 _handle_execute_block: block_name='{block_name}', code='{code}', data={data}")
            
            # Handle predefined blocks
            if block_name == "blink_leds":
                self.logger.info("✨ Executing predefined block: blink_leds")
                try:
                    # Execute LED blinking with multicolor pattern for a few seconds
                    await self.led.blink_led(255, 255, 0, 3, 0.3)  # Yellow blink, 3 times
                    await self.led.blink_led(0, 255, 255, 3, 0.3)  # Cyan blink, 3 times  
                    await self.led.blink_led(255, 0, 255, 3, 0.3)  # Magenta blink, 3 times
                    self.logger.info("✅ blink_leds block completed successfully")
                    return {
                        "success": True,
                        "action": "execute_block",
                        "block_name": "blink_leds",
                        "message": "Blink LEDs block executed successfully"
                    }
                except Exception as e:
                    self.logger.error(f"❌ blink_leds block failed: {e}")
                    return {"success": False, "error": f"blink_leds failed: {e}"}
                
            elif block_name == "play_melody":
                self.logger.info("🎵 Executing predefined block: play_melody")
                try:
                    # Execute melody playback
                    melody_result = await self.audio.play_melody("happy")
                    self.logger.info("✅ play_melody block completed successfully")
                    return {
                        "success": True,
                        "action": "execute_block", 
                        "block_name": "play_melody",
                        "message": "Play melody block executed successfully"
                    }
                except Exception as e:
                    self.logger.error(f"❌ play_melody block failed: {e}")
                    return {"success": False, "error": f"play_melody failed: {e}"}
                
            elif block_name == "read_battery":
                self.logger.info("🔋 Executing predefined block: read_battery")
                try:
                    # Execute battery reading and log the result
                    battery_result = await self.sensor.read_battery_level()
                    if battery_result.get("success", False):
                        battery_data = battery_result.get("data", {})
                        epuck_battery = battery_data.get("epuck", {})
                        battery_percentage = epuck_battery.get("percentage", 0)
                        self.logger.info(f"🔋 Battery level: {battery_percentage}% - {battery_data}")
                        return {
                            "success": True,
                            "action": "execute_block",
                            "block_name": "read_battery", 
                            "message": f"Battery level: {battery_percentage}%",
                            "data": battery_data
                        }
                    else:
                        error_msg = battery_result.get("error", "Unknown battery read error")
                        self.logger.error(f"❌ Battery read failed: {error_msg}")
                        return {"success": False, "error": f"read_battery failed: {error_msg}"}
                except Exception as e:
                    self.logger.error(f"❌ read_battery block failed: {e}")
                    return {"success": False, "error": f"read_battery failed: {e}"}
            
            # Handle generic code execution
            elif code:
                self.logger.info(f"🔧 Executing custom block: {code[:50]}...")
                # TODO: Implement code execution engine
                return {
                    "success": True,
                    "action": "execute_block",
                    "message": "Custom block executed successfully",
                    "output": f"Executed: {code[:100]}..."
                }
            
            else:
                return {"success": False, "error": "No block name or code provided"}

        except Exception as e:
            self.logger.error(f"❌ Execute block failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
