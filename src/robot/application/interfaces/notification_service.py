"""Notification service interface - Application layer port"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class NotificationServiceInterface(ABC):
    """Interface for sending notifications to external clients"""

    @abstractmethod
    async def notify_client_connected(self) -> Dict[str, Any]:
        """Generate welcome message for new client"""
        pass

    @abstractmethod
    async def broadcast_status(self, status_data: Dict[str, Any]) -> None:
        """Broadcast status update to all connected clients"""
        pass

    @abstractmethod
    def get_client_count(self) -> int:
        """Get number of connected clients"""
        pass
