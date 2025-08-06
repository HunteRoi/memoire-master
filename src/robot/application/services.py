"""Application services for robot control"""

import asyncio
import logging
from typing import Set, Dict, Any
import websockets
from websockets.server import WebSocketServerProtocol

from ..domain.entities import RobotState, RobotMessage, RobotResponse, MessageType
from ..domain.interfaces import (
    StateManagerInterface,
    CommandExecutorInterface,
    MotorInterface,
    SensorInterface,
    LEDInterface,
    AudioInterface
)


class RobotService:
    """Main application service for robot control"""
    
    def __init__(
        self,
        state_manager: StateManagerInterface,
        command_executor: CommandExecutorInterface,
        motor: MotorInterface,
        sensors: SensorInterface,
        leds: LEDInterface,
        audio: AudioInterface
    ):
        self.state_manager = state_manager
        self.command_executor = command_executor
        self.motor = motor
        self.sensors = sensors
        self.leds = leds
        self.audio = audio
        self.logger = logging.getLogger(__name__)
        
    async def initialize(self) -> bool:
        """Initialize all hardware components"""
        try:
            await self.motor.initialize()
            await self.sensors.initialize()
            await self.leds.initialize()
            await self.audio.initialize()
            await self.state_manager.set_state(RobotState.IDLE)
            self.logger.info("🤖 Robot service initialized successfully")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize robot service: {e}")
            return False
    
    async def cleanup(self) -> None:
        """Cleanup all hardware components"""
        try:
            await self.motor.cleanup()
            await self.sensors.cleanup()
            await self.leds.cleanup()
            await self.audio.cleanup()
            self.logger.info("🧹 Robot service cleaned up")
        except Exception as e:
            self.logger.error(f"❌ Error during cleanup: {e}")
    
    async def handle_command(self, command: str) -> RobotResponse:
        """Execute a command and return response"""
        try:
            await self.state_manager.set_state(RobotState.RUNNING)
            result = await self.command_executor.execute(command)
            
            return RobotResponse(
                type=MessageType.SUCCESS,
                data={
                    "result": result,
                    "command": command[:100] + "..." if len(command) > 100 else command
                }
            )
        except Exception as e:
            self.logger.error(f"❌ Command execution error: {e}")
            return RobotResponse(
                type=MessageType.ERROR,
                message=f"Command failed: {str(e)}"
            )
        finally:
            current_state = await self.state_manager.get_state()
            if current_state == RobotState.RUNNING:
                await self.state_manager.set_state(RobotState.CONNECTED)
    
    async def get_status(self) -> Dict[str, Any]:
        """Get current robot status"""
        state = await self.state_manager.get_state()
        sensors = await self.sensors.get_all_readings()
        
        return {
            "robot_id": "e-puck2",
            "state": state.value,
            "firmware_version": "1.0.0",
            "sensors": {
                "proximity": sensors.proximity,
                "light": sensors.light,
                "accelerometer": sensors.accelerometer,
                "gyroscope": sensors.gyroscope,
                "microphone": sensors.microphone
            },
            "timestamp": sensors.timestamp
        }


class WebSocketService:
    """Service for handling WebSocket connections"""
    
    def __init__(self, robot_service: RobotService):
        self.robot_service = robot_service
        self.connected_clients: Set[WebSocketServerProtocol] = set()
        self.logger = logging.getLogger(__name__)
    
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new client connection"""
        if path != "/robot":
            await websocket.close(4004, "Invalid path")
            return

        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        self.logger.info(f"🔌 New client connected: {client_id}")
        
        self.connected_clients.add(websocket)
        
        # Update state and send welcome message
        if len(self.connected_clients) == 1:  # First client
            await self.robot_service.state_manager.set_state(RobotState.CONNECTED)
        
        status = await self.robot_service.get_status()
        await self._send_response(websocket, RobotResponse(
            type=MessageType.STATUS,
            data=status
        ))

        try:
            async for message in websocket:
                await self._handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            self.logger.info(f"🔌 Client disconnected: {client_id}")
        except Exception as e:
            self.logger.error(f"❌ Error handling client {client_id}: {e}")
            await self._send_error(websocket, str(e))
        finally:
            self.connected_clients.discard(websocket)
            if not self.connected_clients:  # No more clients
                await self.robot_service.state_manager.set_state(RobotState.IDLE)
    
    async def _handle_message(self, websocket: WebSocketServerProtocol, message_data: str):
        """Handle incoming message from client"""
        try:
            import json
            data = json.loads(message_data)
            message = RobotMessage(
                type=MessageType(data.get('type')),
                data=data.get('data', {})
            )
            
            self.logger.info(f"📨 Received {message.type.value}: {message.data}")
            
            if message.type == MessageType.PING:
                await self._send_response(websocket, RobotResponse(
                    type=MessageType.PONG,
                    data={"timestamp": message.timestamp}
                ))
                
            elif message.type == MessageType.COMMAND:
                command = message.data.get('command', '')
                response = await self.robot_service.handle_command(command)
                await self._send_response(websocket, response)
                
            elif message.type == MessageType.STATUS:
                client_status = message.data.get('status')
                if client_status == 'disconnecting':
                    await websocket.close(1000, "Client requested disconnect")
                    
            else:
                await self._send_error(websocket, f"Unknown message type: {message.type}")
                
        except json.JSONDecodeError:
            await self._send_error(websocket, "Invalid JSON message")
        except ValueError as e:
            await self._send_error(websocket, f"Invalid message type: {e}")
        except Exception as e:
            self.logger.error(f"❌ Error processing message: {e}")
            await self._send_error(websocket, str(e))
    
    async def _send_response(self, websocket: WebSocketServerProtocol, response: RobotResponse):
        """Send response to client"""
        import json
        await websocket.send(json.dumps(response.to_dict()))
    
    async def _send_error(self, websocket: WebSocketServerProtocol, message: str):
        """Send error response to client"""
        response = RobotResponse(type=MessageType.ERROR, message=message)
        await self._send_response(websocket, response)
    
    async def broadcast_status(self, status_data: Dict[str, Any]):
        """Broadcast status to all connected clients"""
        if not self.connected_clients:
            return
            
        response = RobotResponse(type=MessageType.STATUS, data=status_data)
        
        disconnected = []
        for websocket in self.connected_clients.copy():
            try:
                await self._send_response(websocket, response)
            except websockets.exceptions.ConnectionClosed:
                disconnected.append(websocket)
                
        # Clean up disconnected clients
        for websocket in disconnected:
            self.connected_clients.discard(websocket)