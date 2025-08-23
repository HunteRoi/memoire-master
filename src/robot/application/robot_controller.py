"""Robot controller - Application layer orchestrator"""

import logging
from typing import Dict, Any

from application.command_router import CommandRouter
from application.status_handler import StatusHandler
from application.interfaces.message_handler import MessageHandlerInterface
from application.interfaces.notification_service import NotificationServiceInterface


class RobotController(MessageHandlerInterface):
    """Main application controller that orchestrates robot operations"""
    
    def __init__(self, command_router: CommandRouter, status_handler: StatusHandler, notification_service: NotificationServiceInterface):
        self.command_router = command_router
        self.status_handler = status_handler
        self.notification_service = notification_service
        self.logger = logging.getLogger(__name__)
    
    async def handle_client_connected(self) -> Dict[str, Any]:
        """Handle client connection business logic"""
        client_count = self.notification_service.get_client_count()
        self.logger.info(f"🔗 Client connected (total: {client_count})")
        
        # Provide status feedback on robot
        await self.status_handler.on_client_connected()
        
        # Get welcome message from notification service
        return await self.notification_service.notify_client_connected()
    
    async def handle_client_disconnected(self) -> None:
        """Handle client disconnection business logic"""
        client_count = self.notification_service.get_client_count()
        self.logger.info(f"🔌 Client disconnected (remaining: {client_count})")
        
        # Provide status feedback if no more clients
        if client_count == 0:
            await self.status_handler.on_client_disconnected()
    
    async def handle_command(self, command_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle command execution business logic"""
        # Provide visual feedback that command was received
        await self.status_handler.on_command_received()
        
        # Execute command through router
        result = await self.command_router.execute_command(command_data)
        
        # Provide error feedback if command failed
        if not result.get("success", False):
            await self.status_handler.on_command_error()
        
        return {
            "type": "success" if result.get("success", False) else "error",
            "data": result
        }
    
    async def handle_battery_check(self) -> Dict[str, Any]:
        """Handle battery check request"""
        battery_data = await self.command_router.sensor.read_battery_level()
        return {
            "type": "status",
            "data": battery_data
        }
    
    async def handle_ping(self) -> Dict[str, Any]:
        """Handle ping request"""
        import asyncio
        return {
            "type": "pong",
            "data": {"timestamp": asyncio.get_event_loop().time()}
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
    
    @property
    def client_count(self) -> int:
        """Get number of connected clients"""
        return self.notification_service.get_client_count()