"""Main entry point for e-puck2 robot WebSocket server"""

import asyncio
import logging
import signal
import sys
from typing import Optional

import websockets
from websockets.server import WebSocketServerProtocol

# Infrastructure layer
from infrastructure.epuck2_motor import EPuck2Motor
from infrastructure.epuck2_sensors import EPuck2Sensors
from infrastructure.epuck2_leds import EPuck2LEDs
from infrastructure.epuck2_audio import EPuck2Audio

# Application layer
from application.use_cases import CommandExecutor, StateManager, HealthMonitor
from application.services import RobotService, WebSocketService


class RobotServer:
    """Main robot server orchestrator"""

    def __init__(self, host: str = None, port: int = 8765):
        # Auto-detect host if not provided
        if host is None:
            from config.network import get_default_host
            host = get_default_host()
        self.host = host
        self.port = port
        self.server: Optional[websockets.WebSocketServer] = None
        self.robot_service: Optional[RobotService] = None
        self.websocket_service: Optional[WebSocketService] = None
        self.health_monitor: Optional[HealthMonitor] = None
        self.logger = logging.getLogger(__name__)

        # Hardware components
        self.motor: Optional[EPuck2Motor] = None
        self.sensors: Optional[EPuck2Sensors] = None
        self.leds: Optional[EPuck2LEDs] = None
        self.audio: Optional[EPuck2Audio] = None

    async def initialize(self) -> bool:
        """Initialize all components"""
        try:
            self.logger.info("🚀 Starting e-puck2 robot server initialization...")

            # Initialize hardware components
            self.motor = EPuck2Motor()
            self.sensors = EPuck2Sensors()
            self.leds = EPuck2LEDs()
            self.audio = EPuck2Audio()

            # Initialize hardware
            hardware_init = await asyncio.gather(
                self.motor.initialize(),
                self.sensors.initialize(),
                self.leds.initialize(),
                self.audio.initialize(),
                return_exceptions=True
            )

            # Check if all hardware initialized successfully
            if not all(result is True for result in hardware_init):
                self.logger.error("❌ Failed to initialize some hardware components")
                for i, result in enumerate(hardware_init):
                    if result is not True:
                        component = ["motor", "sensors", "leds", "audio"][i]
                        self.logger.error(f"❌ Failed to initialize {component}: {result}")
                return False

            # Initialize use cases
            command_executor = CommandExecutor(
                motor=self.motor,
                leds=self.leds,
                audio=self.audio,
                sensors=self.sensors
            )

            state_manager = StateManager(
                leds=self.leds,
                audio=self.audio
            )

            # Initialize services
            self.robot_service = RobotService(
                state_manager=state_manager,
                command_executor=command_executor,
                motor=self.motor,
                sensors=self.sensors,
                leds=self.leds,
                audio=self.audio
            )

            if not await self.robot_service.initialize():
                self.logger.error("❌ Failed to initialize robot service")
                return False

            # Initialize WebSocket service
            self.websocket_service = WebSocketService(self.robot_service)

            # Initialize health monitoring
            self.health_monitor = HealthMonitor(self.sensors, state_manager)

            self.logger.info("✅ All components initialized successfully")
            return True

        except Exception as e:
            self.logger.error(f"❌ Fatal error during initialization: {e}")
            return False

    async def start(self) -> None:
        """Start the WebSocket server"""
        if not self.websocket_service:
            raise RuntimeError("Server not initialized")

        try:
            # Start health monitoring in background
            if self.health_monitor:
                asyncio.create_task(self.health_monitor.start_monitoring())

            # Start WebSocket server
            self.server = await websockets.serve(
                self.websocket_service.handle_client,
                self.host,
                self.port,
                ping_interval=20,
                ping_timeout=10
            )

            self.logger.info(f"🌐 Robot WebSocket server started on ws://{self.host}:{self.port}/robot")
            self.logger.info("📡 Ready to accept connections...")

            # Wait for server to be closed
            await self.server.wait_closed()

        except Exception as e:
            self.logger.error(f"❌ Server error: {e}")
            raise

    async def shutdown(self) -> None:
        """Shutdown the server gracefully"""
        self.logger.info("🛑 Shutting down robot server...")

        try:
            # Stop health monitoring
            if self.health_monitor:
                self.health_monitor.stop_monitoring()

            # Close WebSocket server
            if self.server:
                self.server.close()
                await self.server.wait_closed()

            # Cleanup robot service
            if self.robot_service:
                await self.robot_service.cleanup()

            # Cleanup hardware components
            if self.motor:
                await self.motor.cleanup()
            if self.sensors:
                await self.sensors.cleanup()
            if self.leds:
                await self.leds.cleanup()
            if self.audio:
                await self.audio.cleanup()

            self.logger.info("✅ Server shutdown complete")

        except Exception as e:
            self.logger.error(f"❌ Error during shutdown: {e}")


async def main():
    """Main entry point"""
    # Setup logging
    from config.logging import setup_logging, get_log_config

    log_config = get_log_config()
    setup_logging(**log_config)

    logger = logging.getLogger(__name__)

    # Create and initialize server
    server = RobotServer()

    # Setup signal handlers for graceful shutdown
    def signal_handler():
        logger.info("📡 Received shutdown signal")
        asyncio.create_task(server.shutdown())

    # Register signal handlers
    if sys.platform != "win32":
        loop = asyncio.get_event_loop()
        for sig in [signal.SIGTERM, signal.SIGINT]:
            loop.add_signal_handler(sig, signal_handler)

    try:
        # Initialize and start server
        if await server.initialize():
            await server.start()
        else:
            logger.error("❌ Server initialization failed")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("📡 Received keyboard interrupt")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        await server.shutdown()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)
