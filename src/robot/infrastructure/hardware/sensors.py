"""Sensor control for e-puck2 robot using custom EPuck2 class"""

import logging
import os
from typing import List
from pipuck.lsm9ds1 import LSM9DS1
from pipuck.pipuck import PiPuck

from .epuck2 import EPuck2
from application.interfaces.hardware.sensor_interface import SensorInterface
from domain.entities import SensorReading


class SensorController(SensorInterface):
    """E-puck2 sensor control using custom EPuck2 class and LSM9DS1 IMU"""

    def __init__(self, pipuck=None):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.pipuck.expansion.imu = None
        self.pipuck = pipuck

    async def initialize(self) -> bool:
        """Initialize sensor controller (PiPuck should already be initialized)"""
        if self._initialized:
            return True

        try:
            if not self.pipuck or not hasattr(self.pipuck, 'epuck') or not self.pipuck.epuck or not isinstance(self.pipuck.epuck, EPuck2):
                raise RuntimeError("PiPuck or EPuck2 not provided or not initialized")

            if not self.pipuck.expansion or not self.pipuck.expansion.imu:
                raise RuntimeError("LSM9DS1 IMU not available in PiPuck expansion")

            self.logger.info("✅ Sensor controller initialized using provided PiPuck and LSM9DS1")
            self._initialized = True
            return True

        except ImportError as ie:
            self.logger.error(f"❌ Required libraries not available for sensor control: {ie}")
            return False
        except Exception as e:
            self.logger.error(f"❌ Sensor controller initialization failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup sensor resources (PiPuck cleanup handled by container)"""
        if self._initialized:
            try:
                self.logger.info("🧹 Sensor controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during sensor cleanup: {e}")

        self._initialized = False

    async def get_proximity(self) -> List[int]:
        """Get proximity sensor readings (8 sensors) via EPuck2"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            return [0] * 8
        try:
            proximity = self.pipuck.epuck.ir_reflected
            self.logger.debug(f"📡 Proximity sensors: {proximity}")
            return proximity
        except Exception as e:
            self.logger.warning(f"⚠️ Proximity sensor read failed: {e}")
            return [0] * 8

    async def get_light(self) -> List[int]:
        """Get light sensor readings (8 sensors) via EPuck2"""
        if not self._initialized or not self.pipuck or not self.pipuck.epuck:
            return [100] * 8
        try:
            light = self.pipuck.epuck.ir_ambient
            self.logger.debug(f"💡 Light sensors: {light}")
            return light
        except Exception as e:
            self.logger.warning(f"⚠️ Light sensor read failed: {e}")
            return [100] * 8

    async def get_magnetometer(self) -> List[float]:
        """Get magnetometer readings [x, y, z] from LSM9DS1 IMU"""
        if not self._initialized:
            return [0.0, 0.0, 0.0]
        try:
            if self.pipuck.expansion.imu:
                mag_x, mag_y, mag_z = self.pipuck.expansion.imu.magnetic
                mag = [mag_x, mag_y, mag_z]
                self.logger.debug(f"🧲 Magnetometer: {mag}")
                return mag
            else:
                return [0.0, 0.0, 0.0]
        except Exception as e:
            self.logger.warning(f"⚠️ Magnetometer read failed: {e}")
            return [0.0, 0.0, 0.0]

    async def get_accelerometer(self) -> List[float]:
        """Get accelerometer readings [x, y, z] from LSM9DS1 IMU"""
        if not self._initialized:
            return [0.0, 0.0, 9.8]
        try:
            if self.pipuck.expansion.imu:
                accel_x, accel_y, accel_z = self.pipuck.expansion.imu.acceleration
                accel = [accel_x, accel_y, accel_z]
                self.logger.debug(f"📐 Accelerometer: {accel}")
                return accel
            else:
                return [0.0, 0.0, 9.8]
        except Exception as e:
            self.logger.warning(f"⚠️ Accelerometer read failed: {e}")
            return [0.0, 0.0, 9.8]

    async def get_gyroscope(self) -> List[float]:
        """Get gyroscope readings [x, y, z] from LSM9DS1 IMU"""
        if not self._initialized:
            return [0.0, 0.0, 0.0]
        try:
            if self.pipuck.expansion.imu:
                gyro_x, gyro_y, gyro_z = self.pipuck.expansion.imu.gyro
                gyro = [gyro_x, gyro_y, gyro_z]
                self.logger.debug(f"🌀 Gyroscope: {gyro}")
                return gyro
            else:
                return [0.0, 0.0, 0.0]
        except Exception as e:
            self.logger.warning(f"⚠️ Gyroscope read failed: {e}")
            return [0.0, 0.0, 0.0]

    async def get_all_readings(self) -> SensorReading:
        """Get all sensor readings at once"""
        proximity = await self.get_proximity()
        light = await self.get_light()
        magnetometer = await self.get_magnetometer()
        accelerometer = await self.get_accelerometer()
        gyroscope = await self.get_gyroscope()
        return SensorReading(
            proximity=proximity,
            light=light,
            magnetometer=magnetometer,
            accelerometer=accelerometer,
            gyroscope=gyroscope
        )

    async def get_battery_level(self) -> dict:
        """Get battery level via PiPuck library (OOP) and legacy sysfs (for comparison)"""
        default_battery_info = {
            "epuck": {"voltage": 3.7, "percentage": 0, "charging": False, "raw_percentage": 0},
            "external": {"voltage": 4.0, "percentage": 0, "charging": False},
            "legacy": {"epuck": {"voltage": 3.7, "percentage": 0}, "external": {"voltage": 4.0, "percentage": 0}}
        }

        if not self._initialized:
            return default_battery_info

        try:
            battery_info = default_battery_info.copy()

            if self.pipuck:
                epuck_charging, epuck_voltage, epuck_percentage = self.pipuck.get_battery_state("epuck")

                battery_info["epuck"] = {
                    "voltage": round(epuck_voltage, 2),
                    "percentage": round(epuck_percentage * 100),
                    "charging": epuck_charging
                }

                self.logger.info(
                    f"🔋 E-puck battery (OOP): {epuck_voltage:.2f}V "
                    f"({epuck_percentage:.2f}%) {'⚡ charging' if epuck_charging else ''} "
                )

                try:
                    aux_charging, aux_voltage, aux_percentage = self.pipuck.get_battery_state("aux")
                    battery_info["external"] = {
                        "voltage": round(aux_voltage, 2),
                        "percentage": round(aux_percentage * 100),
                        "charging": aux_charging,
                    }
                    self.logger.info(
                        f"🔋 External battery (OOP): {aux_voltage:.2f}V "
                        f"({aux_percentage:.2%}) {'⚡ charging' if aux_charging else ''}"
                    )
                except Exception as aux_e:
                    self.logger.debug(f"🔋 No external battery or read failed: {aux_e}")

                # --- Legacy sysfs read (for comparison only) ---
                try:
                    legacy_epuck_voltage, legacy_epuck_percentage = self._read_battery_legacy("epuck")
                    legacy_aux_voltage, legacy_aux_percentage = self._read_battery_legacy("aux")
                    battery_info["legacy"] = {
                        "epuck": {"voltage": legacy_epuck_voltage, "percentage": legacy_epuck_percentage},
                        "external": {"voltage": legacy_aux_voltage, "percentage": legacy_aux_percentage}
                    }
                    self.logger.info(
                        f"📟 Legacy E-puck battery: {legacy_epuck_voltage:.2f}V ({legacy_epuck_percentage:.2f}%)"
                    )
                    self.logger.info(
                        f"📟 Legacy Aux battery: {legacy_aux_voltage:.2f}V ({legacy_aux_percentage:.2f}%)"
                    )
                except Exception as legacy_e:
                    self.logger.debug(f"Legacy battery read failed: {legacy_e}")

            else:
                self.logger.warning("⚠️ PiPuck not available for battery monitoring")

            return battery_info

        except Exception as e:
            self.logger.warning(f"⚠️ Battery read failed: {e}")
            return default_battery_info

    def _read_battery_legacy(self, battery_type: str):
        """Legacy battery reading from sysfs (code 1 style)."""
        EPUCK_BATTERY_PATH = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage0_raw"
        AUX_BATTERY_PATH = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage1_raw"
        EPUCK_BATTERY_PATH_LEGACY = "/sys/bus/i2c/drivers/ads1015/3-0048/in4_input"
        AUX_BATTERY_PATH_LEGACY = "/sys/bus/i2c/drivers/ads1015/3-0048/in5_input"
        EPUCK_BATTERY_SCALE_PATH = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage0_scale"
        AUX_BATTERY_SCALE_PATH = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage1_scale"
        LEGACY_BATTERY_SCALE = 1.0
        BATTERY_MIN_VOLTAGE = 3.3
        BATTERY_MAX_VOLTAGE = 4.138
        BATTERY_VOLTAGE_RANGE = BATTERY_MAX_VOLTAGE - BATTERY_MIN_VOLTAGE

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
            raise FileNotFoundError("Cannot read ADC path")

        if battery_type == "epuck":
            battery_path = epuck_battery_path
            scale_path = epuck_scale_path
        else:
            battery_path = aux_battery_path
            scale_path = aux_scale_path

        if scale_path is not None:
            with open(scale_path, "r") as scale_file:
                scale = float(scale_file.read())
        else:
            scale = LEGACY_BATTERY_SCALE

        with open(battery_path, "r") as battery_file:
            raw_value = float(battery_file.read())
            voltage = round((raw_value * scale) / 500.0, 2)

        percentage = round((voltage - BATTERY_MIN_VOLTAGE) / BATTERY_VOLTAGE_RANGE * 100.0, 2)
        percentage = min(max(percentage, 0.0), 100.0)

        return voltage, percentage

    @property
    def is_initialized(self) -> bool:
        """Check if sensor controller is initialized"""
        return self._initialized
