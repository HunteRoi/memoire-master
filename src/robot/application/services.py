"""Application services for robot control"""

import threading
import logging
import json
import sys
import os

# Add parent directory to path to import websocket_server
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from websocket_server import SimpleWebSocketServer

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

    def initialize(self):
        """Initialize all hardware components"""
        try:
            self.motor.initialize()
            self.sensors.initialize()
            self.leds.initialize()
            self.audio.initialize()
            self.state_manager.set_state(RobotState.IDLE)
            self.logger.info("Robot service initialized successfully")
            return True
        except Exception as e:
            self.logger.error("Failed to initialize robot service: %s" % str(e))
            return False

    def cleanup(self):
        """Cleanup all hardware components"""
        try:
            self.motor.cleanup()
            self.sensors.cleanup()
            self.leds.cleanup()
            self.audio.cleanup()
            self.logger.info("Robot service cleaned up")
        except Exception as e:
            self.logger.error("Error during cleanup: %s" % str(e))

    def handle_command(self, command):
        """Execute a command and return response"""
        try:
            self.state_manager.set_state(RobotState.RUNNING)
            result = self.command_executor.execute(command)

            return RobotResponse(
                type=MessageType.SUCCESS,
                data={
                    "result": result,
                    "command": command[:100] + "..." if len(command) > 100 else command
                }
            )
        except Exception as e:
            self.logger.error("Command execution error: %s" % str(e))
            return RobotResponse(
                type=MessageType.ERROR,
                message="Command failed: %s" % str(e)
            )
        finally:
            current_state = self.state_manager.get_state()
            if current_state == RobotState.RUNNING:
                self.state_manager.set_state(RobotState.CONNECTED)

    def get_status(self):
        """Get current robot status"""
        state = self.state_manager.get_state()
        sensors = self.sensors.get_all_readings()

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

    def __init__(self, robot_service):
        self.robot_service = robot_service
        self.websocket_server = None
        self.connected_clients = set()
        self.clients_lock = threading.Lock()
        self.logger = logging.getLogger(__name__)

    def start_server(self, host='0.0.0.0', port=8765):
        """Start the WebSocket server"""
        self.websocket_server = SimpleWebSocketServer(host, port)
        self.websocket_server.set_message_handler(self._handle_websocket_message)
        
        # Start server in a separate thread
        server_thread = threading.Thread(target=self.websocket_server.start)
        server_thread.daemon = True
        server_thread.start()
        
        self.logger.info("WebSocket server started on %s:%d" % (host, port))
    
    def stop_server(self):
        """Stop the WebSocket server"""
        if self.websocket_server:
            self.websocket_server.stop()
            
    def _handle_websocket_message(self, connection, message):
        """Handle incoming WebSocket message"""
        client_id = "%s:%d" % connection.address
        
        with self.clients_lock:
            if connection not in self.connected_clients:
                self.connected_clients.add(connection)
                self.logger.info("New WebSocket client connected: %s" % client_id)
                
                # Update state and send welcome message
                if len(self.connected_clients) == 1:  # First client
                    self.robot_service.state_manager.set_state(RobotState.CONNECTED)
                
                # Send welcome message with status
                status = self.robot_service.get_status()
                response = RobotResponse(type=MessageType.STATUS, data=status)
                self._send_response(connection, response)
        
        # Handle the message
        try:
            self._handle_message(connection, message)
        except Exception as e:
            self.logger.error("Error handling message from %s: %s" % (client_id, str(e)))
            self._send_error(connection, str(e))

    def _handle_message(self, connection, message_data):
        """Handle incoming message from client"""
        try:
            data = json.loads(message_data)
            message = RobotMessage(
                type=MessageType(data.get('type')),
                data=data.get('data', {})
            )

            self.logger.info("Received %s: %s" % (message.type.value, str(message.data)))

            if message.type == MessageType.PING:
                self._send_response(connection, RobotResponse(
                    type=MessageType.PONG,
                    data={"timestamp": message.timestamp}
                ))

            elif message.type == MessageType.COMMAND:
                command = message.data.get('command', '')
                response = self.robot_service.handle_command(command)
                self._send_response(connection, response)

            elif message.type == MessageType.STATUS:
                client_status = message.data.get('status')
                if client_status == 'disconnecting':
                    connection.close()
                    with self.clients_lock:
                        self.connected_clients.discard(connection)
                        if not self.connected_clients:
                            self.robot_service.state_manager.set_state(RobotState.IDLE)

            else:
                self._send_error(connection, "Unknown message type: %s" % str(message.type))

        except ValueError:
            self._send_error(connection, "Invalid JSON message")
        except Exception as e:
            self.logger.error("Error processing message: %s" % str(e))
            self._send_error(connection, str(e))

    def _send_response(self, connection, response):
        """Send response to client"""
        try:
            message = json.dumps(response.to_dict())
            connection.send_message(message)
        except Exception as e:
            self.logger.error("Error sending response: %s" % str(e))

    def _send_error(self, connection, message):
        """Send error response to client"""
        response = RobotResponse(type=MessageType.ERROR, message=message)
        self._send_response(connection, response)

    def broadcast_status(self, status_data):
        """Broadcast status to all connected clients"""
        with self.clients_lock:
            if not self.connected_clients:
                return

            response = RobotResponse(type=MessageType.STATUS, data=status_data)
            message = json.dumps(response.to_dict())

            disconnected = []
            for connection in self.connected_clients.copy():
                if not connection.send_message(message):
                    disconnected.append(connection)

            # Clean up disconnected clients
            for connection in disconnected:
                self.connected_clients.discard(connection)
