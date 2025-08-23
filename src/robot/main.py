#!/usr/bin/env python3
"""Modern Python 3 WebSocket server for e-puck2 robot control"""

import asyncio
import logging
import os
import signal
import sys

# Import clean architecture components
from application.robot_controller import RobotController
from application.command_router import CommandRouter
from application.status_handler import StatusHandler
from application.use_cases.motor_use_cases import MotorUseCases
from application.use_cases.led_use_cases import LEDUseCases
from application.use_cases.audio_use_cases import AudioUseCases
from application.use_cases.sensor_use_cases import SensorUseCases
from infrastructure.hardware.motors import MotorController
from infrastructure.hardware.leds import LEDController
from infrastructure.hardware.audio import AudioController
from infrastructure.hardware.sensors import SensorController
from infrastructure.websocket.websocket_server import WebSocketService

# Configure logging
log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class EPuck2Server:
    """Modern e-puck2 server with Clean Architecture"""
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.logger = logging.getLogger(__name__)
        
        # Initialize hardware controllers (infrastructure layer)
        self.motor_controller = MotorController()
        self.led_controller = LEDController()
        self.audio_controller = AudioController()
        self.sensor_controller = SensorController()
        
        # Initialize use cases (application layer)
        self.motor_use_cases = MotorUseCases(self.motor_controller)
        self.led_use_cases = LEDUseCases(self.led_controller)
        self.audio_use_cases = AudioUseCases(self.audio_controller)
        self.sensor_use_cases = SensorUseCases(self.sensor_controller)
        
        # Initialize command router
        self.command_router = CommandRouter(
            self.motor_use_cases,
            self.led_use_cases,
            self.audio_use_cases,
            self.sensor_use_cases
        )
        
        # Initialize status handler
        self.status_handler = StatusHandler(
            self.led_use_cases,
            self.audio_use_cases
        )
        
        # Initialize WebSocket service (infrastructure layer)
        self.websocket_service = WebSocketService(None)  # Temporary
        
        # Initialize robot controller (application layer orchestrator)
        self.robot_controller = RobotController(
            self.command_router,
            self.status_handler,
            self.websocket_service  # Inject notification service
        )
        
        # Complete the dependency injection
        self.websocket_service.message_handler = self.robot_controller
            
    async def start_server(self):
        """Start the e-puck2 server"""
        self.logger.info(f"🚀 Starting e-puck2 server on {self.host}:{self.port}")
        
        # Initialize hardware controllers
        try:
            self.logger.info("🔧 Initializing hardware controllers...")
            
            motor_ok = await self.motor_controller.initialize()
            led_ok = await self.led_controller.initialize()
            audio_ok = await self.audio_controller.initialize()
            sensor_ok = await self.sensor_controller.initialize()
            
            if not (motor_ok and led_ok and audio_ok and sensor_ok):
                self.logger.warning("⚠️ Some hardware initialization failed, continuing with limited functionality")
            else:
                self.logger.info("✅ All hardware controllers initialized successfully")
                # Provide startup feedback
                await self.status_handler.on_startup()
        except Exception as e:
            self.logger.warning(f"⚠️ Hardware initialization error: {e}, continuing with limited functionality")
        
        # Start WebSocket server (infrastructure layer)
        self.server = await self.websocket_service.start_server(self.host, self.port)
        self.logger.info(f"🌐 Server ready on ws://{self.host}:{self.port}")
        
        # Keep server running until stopped
        try:
            await self.server.wait_closed()
        except asyncio.CancelledError:
            self.logger.info("📡 Server shutdown requested")
        
    async def stop_server(self):
        """Stop the server"""
        self.logger.info("📡 Stopping server...")
        
        # Stop WebSocket server (infrastructure layer)
        await self.websocket_service.stop_server()
        
        # Provide shutdown feedback
        try:
            await self.status_handler.on_shutdown()
        except Exception as e:
            self.logger.warning(f"Shutdown feedback failed: {e}")
        
        # Cleanup hardware controllers
        try:
            await self.motor_controller.cleanup()
            await self.led_controller.cleanup()
            await self.audio_controller.cleanup()
            await self.sensor_controller.cleanup()
        except Exception as e:
            self.logger.error(f"❌ Error cleaning up hardware controllers: {e}")
            
        self.logger.info("📡 Server stopped")
            
async def main():
    """Main entry point"""
    # Load configuration from environment
    import os
    host = os.getenv('ROBOT_HOST', '0.0.0.0')
    port = int(os.getenv('ROBOT_PORT', '8765'))
    
    # Create server
    server = EPuck2Server(host, port)
    
    # Handle shutdown gracefully
    shutdown_event = asyncio.Event()
    
    def signal_handler():
        logging.info("📡 Received shutdown signal")
        shutdown_event.set()
        
    # Register signal handlers
    if sys.platform != "win32":
        loop = asyncio.get_event_loop()
        for sig in [signal.SIGTERM, signal.SIGINT]:
            loop.add_signal_handler(sig, signal_handler)
    
    try:
        # Start server in background
        server_task = asyncio.create_task(server.start_server())
        
        # Wait for shutdown signal
        await shutdown_event.wait()
        
        # Stop server gracefully
        await server.stop_server()
        
        # Cancel server task
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass
            
        logging.info("📡 Server shutdown complete")
        
    except KeyboardInterrupt:
        logging.info("📡 Server stopped by user")
        await server.stop_server()
    except Exception as e:
        logging.error(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())