"""Sensor control for e-puck2 robot - Pi-puck implementation"""

import logging
from typing import List
from pipuck.epuck import EPuck2
from pipuck.lsm9ds1 import LSM9DS1
from pipuck import PiPuck

from application.interfaces.hardware.sensor_interface import SensorInterface
from domain.entities import SensorReading


class SensorController(SensorInterface):
    """E-puck2 sensor control using Pi-puck EPuck2 library and LSM9DS1 IMU"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.epuck = None
        self.imu = None
        self.pipuck = None

    async def initialize(self) -> bool:
        """Initialize EPuck2 and LSM9DS1 sensor control"""
        if self._initialized:
            return True

        try:
            # Initialize EPuck2 instance for robot-specific sensors
            self.epuck = EPuck2()
            
            # Initialize PiPuck for battery monitoring
            try:
                self.pipuck = PiPuck(epuck_version=2, tof_sensors=[False]*6, yrl_expansion=False)
                self.logger.info("✅ PiPuck initialized for battery monitoring")
            except Exception as pipuck_e:
                self.logger.warning(f"⚠️ PiPuck not available for battery monitoring: {pipuck_e}")
                self.pipuck = None
            
            # Initialize LSM9DS1 IMU for accelerometer and gyroscope
            try:
                self.imu = LSM9DS1()  # Use default I2C bus
                self.logger.info("✅ LSM9DS1 IMU initialized")
            except Exception as imu_e:
                self.logger.warning(f"⚠️ LSM9DS1 IMU not available: {imu_e}")
                self.imu = None
            
            self.logger.info("✅ Sensor controller initialized with EPuck2, PiPuck and LSM9DS1 libraries")
            self._initialized = True
            return True

        except ImportError as ie:
            self.logger.error(f"❌ Required libraries not available for sensor control: {ie}")
            return False
        except Exception as e:
            self.logger.error(f"❌ Sensor controller initialization failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup sensor resources"""
        if self._initialized:
            try:
                if self.imu:
                    self.imu.close()
                self.logger.info("🧹 Sensor controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during sensor cleanup: {e}")

        self._initialized = False
        self.epuck = None
        self.imu = None

    async def get_proximity(self) -> List[int]:
        """Get proximity sensor readings (8 sensors) via EPuck2"""
        if not self._initialized or not self.epuck:
            return [0] * 8

        try:
            # Note: EPuck2 proximity sensor methods need to be determined from library documentation
            # This is a placeholder until proper EPuck2 sensor methods are identified
            self.logger.debug("📡 Proximity sensor reading via EPuck2 (placeholder)")
            proximity = [0] * 8
            self.logger.debug(f"📡 Proximity sensors: {proximity}")
            return proximity

        except Exception as e:
            self.logger.warning(f"⚠️ Proximity sensor read failed: {e}")
            return [0] * 8

    async def get_light(self) -> List[int]:
        """Get light sensor readings (8 sensors) via EPuck2"""
        if not self._initialized or not self.epuck:
            return [100] * 8

        try:
            # Note: EPuck2 light sensor methods need to be determined from library documentation
            # This is a placeholder until proper EPuck2 sensor methods are identified
            self.logger.debug("💡 Light sensor reading via EPuck2 (placeholder)")
            light = [100] * 8
            self.logger.debug(f"💡 Light sensors: {light}")
            return light

        except Exception as e:
            self.logger.warning(f"⚠️ Light sensor read failed: {e}")
            return [100] * 8

    async def get_accelerometer(self) -> List[float]:
        """Get accelerometer readings [x, y, z] from LSM9DS1 IMU"""
        if not self._initialized:
            return [0.0, 0.0, 9.8]

        try:
            if self.imu:
                # Read accelerometer values from LSM9DS1
                accel_x, accel_y, accel_z = self.imu.acceleration
                accel = [accel_x, accel_y, accel_z]
                self.logger.debug(f"📐 Accelerometer: {accel}")
                return accel
            else:
                # Fallback values if IMU not available
                return [0.0, 0.0, 9.8]

        except Exception as e:
            self.logger.warning(f"⚠️ Accelerometer read failed: {e}")
            return [0.0, 0.0, 9.8]

    async def get_gyroscope(self) -> List[float]:
        """Get gyroscope readings [x, y, z] from LSM9DS1 IMU"""
        if not self._initialized:
            return [0.0, 0.0, 0.0]

        try:
            if self.imu:
                # Read gyroscope values from LSM9DS1
                gyro_x, gyro_y, gyro_z = self.imu.gyro
                gyro = [gyro_x, gyro_y, gyro_z]
                self.logger.debug(f"🌀 Gyroscope: {gyro}")
                return gyro
            else:
                # Fallback values if IMU not available
                return [0.0, 0.0, 0.0]

        except Exception as e:
            self.logger.warning(f"⚠️ Gyroscope read failed: {e}")
            return [0.0, 0.0, 0.0]

    async def get_microphone(self) -> float:
        """Get microphone level from e-puck via EPuck2"""
        if not self._initialized or not self.epuck:
            return 0.0

        try:
            # Note: EPuck2 microphone methods need to be determined from library documentation
            # This is a placeholder until proper EPuck2 sensor methods are identified
            self.logger.debug("🎤 Microphone reading via EPuck2 (placeholder)")
            mic_level = 0.0
            self.logger.debug(f"🎤 Microphone: {mic_level}")
            return mic_level

        except Exception as e:
            self.logger.warning(f"⚠️ Microphone read failed: {e}")
            return 0.0

    async def get_all_readings(self) -> SensorReading:
        """Get all sensor readings at once"""
        proximity = await self.get_proximity()
        light = await self.get_light()
        accelerometer = await self.get_accelerometer()
        gyroscope = await self.get_gyroscope()
        microphone = await self.get_microphone()

        return SensorReading(
            proximity=proximity,
            light=light,
            accelerometer=accelerometer,
            gyroscope=gyroscope,
            microphone=microphone
        )

    async def get_battery_level(self) -> dict:
        """Get battery level via Pi-puck battery monitor"""
        epuck_battery_path = ""
        aux_battery_path = ""
        epuck_scale_path = ""
        aux_scale_path = ""
        default_battery_info = {"epuck": {"voltage": 3.7, "percentage": 75}, "external": {"voltage": 0.0, "percentage": 0}}

        if os.path.exists(EPUCK_BATTERY_PATH):
            epuck_battery_path = EPUCK_BATTERY_PATH
            aux_battery_path = AUX_BATTERY_PATH
            epuck_scale_path = EPUCK_BATTERY_SCALE_PATH
            aux_scale_path = AUX_BATTERY_SCALE_PATH
        elif os.path.exists(EPUCK_BATTERY_PATH_LEGACY):
            epuck_battery_path = EPUCK_BATTERY_PATH_LEGACY
            aux_battery_path = AUX_BATTERY_PATH_LEGACY
            epuck_scale_path = None
            aux_scale_path = None
        else:
            self.logger.warning("⚠️ No battery monitor paths found")
            return default_battery_info

        try:
            battery_info = default_battery_info

            voltage_epuck, percentage_epuck = self._get_epuck_battery_data(epuck_battery_path, epuck_scale_path)
            if voltage_epuck is not None and percentage_epuck is not None:
                battery_info["epuck"] = {"voltage": voltage_epuck, "percentage": percentage_epuck}
            voltage_ext, percentage_ext = self._get_external_battery_data(aux_battery_path, aux_scale_path)
            if voltage_ext is not None and percentage_ext is not None:
                battery_info["external"] = {"voltage": voltage_ext, "percentage": percentage_ext}

            return battery_info

        except Exception as e:
            self.logger.warning(f"⚠️ Battery read failed: {e}")
            return default_battery_info

    def _get_external_battery_data(self, aux_battery_path, aux_scale_path):
        scale = 0.0
        voltage = 0.0
        raw_value = 0
        percentage = 0.0

        if aux_scale_path is not None:
            with open(aux_scale_path, "r") as scale_file:
                scale = float(scale_file.read())
        else:
            scale = LEGACY_BATTERY_SCALE

        with open(aux_battery_path, "r") as battery_file:
            raw_value = float(battery_file.read())
            voltage = round((raw_value * scale) / 500.0, 2)

        percentage = round((voltage - BATTERY_MIN_VOLTAGE) / BATTERY_VOLTAGE_RANGE * 100.0, 2)
        if percentage < 0.0:
            percentage = 0.0
        elif percentage > 100.0:
            percentage = 100.0
        return voltage,percentage

    def _get_epuck_battery_data(self, epuck_battery_path, epuck_scale_path):
        scale = 0.0
        voltage = 0.0
        raw_value = 0
        percentage = 0.0

        if epuck_scale_path is not None:
            with open(epuck_scale_path, "r") as scale_file:
                scale = float(scale_file.read())
        else:
            scale = LEGACY_BATTERY_SCALE

        with open(epuck_battery_path, "r") as battery_file:
            raw_value = float(battery_file.read())
            voltage = round((raw_value * scale) / 500.0, 2)

        percentage = round((voltage - BATTERY_MIN_VOLTAGE) / BATTERY_VOLTAGE_RANGE * 100.0, 2)
        if percentage < 0.0:
            percentage = 0.0
        elif percentage > 100.0:
            percentage = 100.0
        return voltage,percentage

    @property
    def is_initialized(self) -> bool:
        """Check if sensor controller is initialized"""
        return self._initialized
