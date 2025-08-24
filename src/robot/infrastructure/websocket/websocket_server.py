"""WebSocket server - Infrastructure layer adapter"""

import asyncio
import json
import logging
import websockets
from typing import Set, Dict, Any, Optional
from websockets.server import WebSocketServerProtocol

from application.interfaces.message_handler import MessageHandlerInterface
from application.interfaces.notification_service import NotificationServiceInterface


class WebSocketService(NotificationServiceInterface):
    """WebSocket server adapter - Infrastructure implements Application interface"""

    def __init__(self, message_handler: MessageHandlerInterface):
        self.message_handler = message_handler  # Application layer interface
        self.websocket_server = None
        self.connected_clients: Set[WebSocketServerProtocol] = set()
        self.logger = logging.getLogger(__name__)

    async def start_server(self, host: str = '0.0.0.0', port: int = 8765):
        """Start the WebSocket server"""
        try:
            self.logger.info(f"🌐 Starting WebSocket server on {host}:{port}")
            
            self.websocket_server = await websockets.serve(
                self.handle_client_connection, 
                host, 
                port
            )
            
            self.logger.info(f"✅ WebSocket server started on {host}:{port}")
            return self.websocket_server
            
        except Exception as e:
            self.logger.error(f"❌ Failed to start WebSocket server: {e}")
            raise

    async def stop_server(self):
        """Stop the WebSocket server"""
        try:
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
            # Register client
            self.connected_clients.add(websocket)
            self.logger.debug(f"🔗 WebSocket client connected: {client_id}")
            
            # Delegate to application layer
            welcome_message = await self.message_handler.handle_client_connected()
            await websocket.send(json.dumps(welcome_message))
            
            # Handle messages from this client
            async for message in websocket:
                await self._handle_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            self.logger.error(f"❌ Error handling client {client_id}: {e}")
        finally:
            # Cleanup on disconnect
            self.connected_clients.discard(websocket)
            self.logger.debug(f"🔌 WebSocket client disconnected: {client_id}")
            
            # Delegate to application layer
            await self.message_handler.handle_client_disconnected()

    async def _handle_message(self, websocket: WebSocketServerProtocol, message_data: str):
        """Handle incoming message from client - Pure adapter logic"""
        try:
            # Parse JSON message
            data = json.loads(message_data)
            msg_type = data.get('type')
            msg_data = data.get('data', {})
            
            self.logger.debug(f"📨 WebSocket received {msg_type}")
            
            # Route to appropriate application layer handler
            response = None
            
            if msg_type == 'ping':
                response = await self.message_handler.handle_ping()
                
            elif msg_type == 'command':
                response = await self.message_handler.handle_command(msg_data)
                
            elif msg_type == 'battery_check':
                response = await self.message_handler.handle_battery_check()
                
            elif msg_type == 'status':
                await self.message_handler.handle_status_message(msg_data)
                # No response needed for status messages
                
            else:
                # Unknown message type
                response = {
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                }
            
            # Send response if there is one
            if response:
                await websocket.send(json.dumps(response))

        except json.JSONDecodeError:
            error = {"type": "error", "message": "Invalid JSON"}
            await websocket.send(json.dumps(error))
        except Exception as e:
            self.logger.error(f"❌ WebSocket message error: {e}")
            error = {"type": "error", "message": str(e)}
            await websocket.send(json.dumps(error))

    # NotificationServiceInterface implementation
    async def notify_client_connected(self) -> Dict[str, Any]:
        """Generate welcome message for new client with battery and status info"""
        import asyncio
        from application.interfaces.message_handler import MessageHandlerInterface
        
        # Get battery and status info from message handler if available
        if hasattr(self, 'message_handler') and self.message_handler:
            try:
                ping_response = await self.message_handler.handle_ping()
                ping_data = ping_response.get('data', {})
                
                return {
                    "type": "status",
                    "data": {
                        "robot_id": ping_data.get("robot_id", "epuck2"),
                        "state": "connected",
                        "firmware_version": "1.0.0",
                        "timestamp": ping_data.get("timestamp", asyncio.get_event_loop().time()),
                        "battery": ping_data.get("battery", 0),
                        "battery_voltage": ping_data.get("battery_voltage", 0.0),
                        "status": ping_data.get("status", "connected"),
                        "client_count": ping_data.get("client_count", 1),
                        "hardware": ping_data.get("hardware", {
                            "motors": False,
                            "leds": False,
                            "audio": False,
                            "sensors": False
                        })
                    }
                }
            except Exception as e:
                # Fallback to basic status if there's an error getting detailed info
                pass
        
        # Fallback basic message
        return {
            "type": "status",
            "data": {
                "robot_id": "epuck2",
                "state": "connected",
                "firmware_version": "1.0.0",
                "timestamp": asyncio.get_event_loop().time(),
                "battery": 0,
                "status": "connected"
            }
        }
    
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
    
    def get_client_count(self) -> int:
        """Get number of connected clients"""
        return len(self.connected_clients)