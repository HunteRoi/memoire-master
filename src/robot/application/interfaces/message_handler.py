"""Message handler interface - Application layer port"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class MessageHandlerInterface(ABC):
    """Interface for handling incoming messages"""

    @abstractmethod
    async def handle_client_connected(self) -> Dict[str, Any]:
        """Handle client connection and return welcome message"""
        pass

    @abstractmethod
    async def handle_client_disconnected(self) -> None:
        """Handle client disconnection"""
        pass

    @abstractmethod
    async def handle_command(self, command_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle command execution"""
        pass

    @abstractmethod
    async def handle_battery_check(self) -> Dict[str, Any]:
        """Handle battery check request"""
        pass

    @abstractmethod
    async def handle_ping(self) -> Dict[str, Any]:
        """Handle ping request"""
        pass

    @abstractmethod
    async def handle_status_message(self, status_data: Dict[str, Any]) -> None:
        """Handle status message from client"""
        pass
