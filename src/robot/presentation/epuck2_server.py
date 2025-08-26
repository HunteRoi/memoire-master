import logging
from pipuck.pipuck import PiPuck
import RPi.GPIO as GPIO

from application.robot_controller import RobotController
from application.use_cases.motor_use_cases import MotorUseCases
from application.use_cases.led_use_cases import LEDUseCases
from application.use_cases.audio_use_cases import AudioUseCases
from application.use_cases.sensor_use_cases import SensorUseCases
from infrastructure.hardware.controllers.motors import MotorController
from infrastructure.hardware.controllers.leds import LEDController
from infrastructure.hardware.controllers.audio import AudioController
from infrastructure.hardware.controllers.sensors import SensorController
from infrastructure.hardware.epuck2 import EPuck2
from .websocket_manager import WebsocketManager


class EPuck2Server:
    """Modern e-puck2 server with Clean Architecture"""

    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.logger = logging.getLogger(__name__)
        self.pipuck = None

        # Initialize shared PiPuck with custom EPuck2
        self._initialize_pipuck()

        # Initialize hardware controllers with shared PiPuck (infrastructure layer)
        self.motor_controller = MotorController(self.pipuck)
        self.led_controller = LEDController(self.pipuck)
        self.audio_controller = AudioController(self.pipuck)
        self.sensor_controller = SensorController(self.pipuck)

        # Initialize use cases and main controller (application layer)
        self.motor_use_cases = MotorUseCases(self.motor_controller)
        self.led_use_cases = LEDUseCases(self.led_controller)
        self.audio_use_cases = AudioUseCases(self.audio_controller)
        self.sensor_use_cases = SensorUseCases(self.sensor_controller)
        self.robot_controller = RobotController(
            self.led_use_cases,
            self.audio_use_cases,
            self.sensor_use_cases,
            self.motor_use_cases,
        )

        # Initialize websocket manager (presentation layer)
        self.websocket_service = WebsocketManager(self.robot_controller)

    def _initialize_pipuck(self):
        """Initialize shared PiPuck instance with custom EPuck2"""
        try:
            self.logger.info("🔧 Initializing shared PiPuck with custom EPuck2...")

            # Initialize PiPuck with minimal configuration to avoid GPIO conflicts
            self.pipuck = PiPuck(epuck_version=2, tof_sensors=[False]*6, yrl_expansion=False)
            # Replace PiPuck's epuck with our custom EPuck2 class
            self.pipuck.epuck = EPuck2()
            self.pipuck.epuck.initialize()

            self.logger.info("✅ Shared PiPuck initialized with custom EPuck2")

        except Exception as e:
            self.logger.error(f"❌ PiPuck initialization failed: {e}")
            self.pipuck = None
            exit(1)

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
        except Exception as e:
            self.logger.warning(f"⚠️ Hardware initialization error: {e}, continuing with limited functionality")

        # Start WebSocket server (infrastructure layer)
        self.server = await self.websocket_service.start_server(self.host, self.port)
        self.logger.info(f"🌐 Server ready on ws://{self.host}:{self.port}")

    async def stop_server(self):
        """Stop the server"""
        self.logger.info("📡 Stopping server...")

        await self.websocket_service.stop_server()

        # Cleanup hardware controllers
        try:
            await self.motor_controller.cleanup()
            await self.led_controller.cleanup()
            await self.audio_controller.cleanup()
            await self.sensor_controller.cleanup()

            # Cleanup shared PiPuck
            if self.pipuck:
                if hasattr(self.pipuck, 'epuck') and self.pipuck.epuck:
                    self.pipuck.epuck.close()
                if hasattr(self.pipuck, 'close'):
                    self.pipuck.close()
                self.logger.info("🧹 Shared PiPuck cleaned up")

        except Exception as e:
            self.logger.error(f"❌ Error cleaning up hardware controllers: {e}")

        self.logger.info("📡 Server stopped")
