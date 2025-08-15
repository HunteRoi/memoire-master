"""Main entry point for e-puck2 robot WebSocket server"""

import threading
import logging
import signal
import sys
import json
import time

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

    def __init__(self, host=None, port=8765):
        # Auto-detect host if not provided
        if host is None:
            try:
                from config.network import get_default_host
                host = get_default_host()
            except ImportError:
                host = '192.168.0.121'  # Default for Pi
        self.host = host
        self.port = port
        self.robot_service = None
        self.websocket_service = None
        self.health_monitor = None
        self.running = False
        self.logger = logging.getLogger(__name__)

        # Hardware components
        self.motor = None
        self.sensors = None
        self.leds = None
        self.audio = None

    def initialize(self):
        """Initialize all components"""
        try:
            self.logger.info("Starting e-puck2 robot server initialization...")

            # Initialize hardware components
            self.motor = EPuck2Motor()
            self.sensors = EPuck2Sensors()
            self.leds = EPuck2LEDs()
            self.audio = EPuck2Audio()

            # Initialize hardware
            try:
                self.motor.initialize()
                self.sensors.initialize()
                self.leds.initialize()
                self.audio.initialize()
            except Exception as e:
                self.logger.error("Failed to initialize hardware: %s" % str(e))
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

            if not self.robot_service.initialize():
                self.logger.error("Failed to initialize robot service")
                return False

            # Initialize WebSocket service
            self.websocket_service = WebSocketService(self.robot_service)

            # Initialize health monitoring
            self.health_monitor = HealthMonitor(self.sensors, state_manager)

            self.logger.info("All components initialized successfully")
            return True

        except Exception as e:
            self.logger.error("Fatal error during initialization: %s" % str(e))
            return False

    def start(self):
        """Start the WebSocket server"""
        if not self.websocket_service:
            raise RuntimeError("Server not initialized")

        try:
            # Start health monitoring in background
            if self.health_monitor:
                health_thread = threading.Thread(target=self.health_monitor.start_monitoring)
                health_thread.daemon = True
                health_thread.start()

            # Start WebSocket server
            self.websocket_service.start_server(self.host, self.port)
            self.logger.info("Ready to accept WebSocket connections...")

            # Keep main thread alive
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass

        except Exception as e:
            self.logger.error("Server error: %s" % str(e))
            raise

    def shutdown(self):
        """Shutdown the server gracefully"""
        self.logger.info("Shutting down robot server...")

        try:
            self.running = False
            
            # Stop health monitoring
            if self.health_monitor:
                self.health_monitor.stop_monitoring()

            # Stop WebSocket server
            if self.websocket_service:
                self.websocket_service.stop_server()

            # Cleanup robot service
            if self.robot_service:
                self.robot_service.cleanup()

            # Cleanup hardware components
            if self.motor:
                self.motor.cleanup()
            if self.sensors:
                self.sensors.cleanup()
            if self.leds:
                self.leds.cleanup()
            if self.audio:
                self.audio.cleanup()

            self.logger.info("Server shutdown complete")

        except Exception as e:
            self.logger.error("Error during shutdown: %s" % str(e))


def main():
    """Main entry point"""
    # Setup logging
    from config.logging import setup_logging, get_log_config

    log_config = get_log_config()
    setup_logging(**log_config)

    logger = logging.getLogger(__name__)

    # Create and initialize server
    server = RobotServer()

    # Setup signal handlers for graceful shutdown
    def signal_handler(signum, frame):
        logger.info("Received shutdown signal")
        server.shutdown()
        sys.exit(0)

    # Register signal handlers
    if sys.platform != "win32":
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

    try:
        # Initialize and start server
        if server.initialize():
            server.start()
        else:
            logger.error("Server initialization failed")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
        server.shutdown()
    except Exception as e:
        logger.error("Unexpected error: %s" % str(e))
        server.shutdown()
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print("Fatal error: %s" % str(e))
        sys.exit(1)
