import json
import logging
import websockets
from typing import Set, Dict, Any
from websockets.server import WebSocketServerProtocol

from application.robot_controller import RobotController

class WebsocketManager:
    """Manages WebSocket connections and delegates to RobotController for handling events."""

    def __init__(self, robot_controller: RobotController):
        """Initialize with RobotController instance."""
        self.logger = logging.getLogger(__name__)
        self.robot_controller = robot_controller
        self.connected_clients: Set[WebSocketServerProtocol] = set()
        self.websocket_server = None

    async def start_server(self, host: str = '0.0.0.0', port: int = 8765):
        """Start the WebSocket server."""
        try:
            self.logger.info(f"🌐 Starting WebSocket server on {host}:{port}")

            self.websocket_server = await websockets.serve(
                self.handle_client_connection,
                host,
                port
            )
            self.logger.info(f"✅ WebSocket server started on {host}:{port}")

            await self.robot_controller.on_startup()
            return self.websocket_server
        except Exception as e:
            self.logger.error(f"❌ Failed to start WebSocket server: {e}")
            raise

    async def stop_server(self):
        """Stop the WebSocket server."""
        try:
            self.robot_controller.on_shutdown()
            if self.websocket_server:
                self.websocket_server.close()
                await self.websocket_server.wait_closed()
            self.logger.info("🛑 WebSocket server stopped")
        except Exception as e:
            self.logger.error(f"❌ Error stopping WebSocket server: {e}")

    async def handle_client_connection(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new client connection"""
        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"

        try:
            self.connected_clients.add(websocket)
            self.logger.debug(f"🔗 WebSocket client connected: {client_id}")

            welcome_message = await self.robot_controller.handle_client_connected(self.client_count)
            await websocket.send(json.dumps(welcome_message))

            async for message in websocket:
                await self.handle_message(websocket, message)

        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            self.logger.error(f"❌ Error handling client {client_id}: {e}")
        finally: # Cleanup on disconnect
            self.connected_clients.discard(websocket)
            self.logger.debug(f"🔌 WebSocket client disconnected: {client_id}")
            await self.robot_controller.handle_client_disconnected(self.client_count)

    async def handle_message(self, websocket: WebSocketServerProtocol, message_data: str):
        """Handle incoming message from client - Pure adapter logic"""
        try:
            data = json.loads(message_data)
            msg_type = data.get('type')
            msg_data = data.get('data', {})

            self.logger.debug(f"📨 WebSocket received {msg_type}")

            response = None
            if msg_type == 'ping':
                response = await self.robot_controller.handle_ping(self.client_count)
            elif msg_type == 'command':
                response = await self.robot_controller.handle_command(msg_data)
            elif msg_type == 'battery_check':
                response = await self.robot_controller.handle_battery_check()
            elif msg_type == 'status':
                await self.robot_controller.handle_status_message(msg_data)
            else: # Unknown message type
                response = {
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                }

            if response:
                await websocket.send(json.dumps(response))

        except json.JSONDecodeError:
            error = {"type": "error", "message": "Invalid JSON"}
            await websocket.send(json.dumps(error))
        except Exception as e:
            self.logger.error(f"❌ WebSocket message error: {e}")
            error = {"type": "error", "message": str(e)}
            await websocket.send(json.dumps(error))

    async def broadcast_status(self, status_data: Dict[str, Any]) -> None:
        """Broadcast status to all connected clients"""
        if not self.connected_clients:
            return

        message = json.dumps({
            "type": "status",
            "data": status_data
        })

        # Send to all clients
        disconnected = []
        for websocket in self.connected_clients.copy():
            try:
                await websocket.send(message)
            except Exception as e:
                self.logger.warning(f"⚠️ Failed to send to client: {e}")
                disconnected.append(websocket)

        # Clean up disconnected clients
        for websocket in disconnected:
            self.connected_clients.discard(websocket)

    @property
    def client_count(self) -> int:
        """Get number of connected clients"""
        return len(self.connected_clients)
