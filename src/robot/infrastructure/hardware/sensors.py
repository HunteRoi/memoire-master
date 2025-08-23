"""Sensor control for e-puck2 robot - Pi-puck I2C implementation"""

import asyncio
import logging
import os
from typing import List, Dict, Any
from application.interfaces.hardware.sensor_interface import SensorInterface
from domain.entities import SensorReading


class SensorController(SensorInterface):
    """E-puck2 sensor control using Pi-puck I2C communication"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
        self.i2c_bus = None
        
        # Pi-puck I2C addresses
        self.epuck_address = 0x1f     # Main e-puck2 controller
        self.imu_address = 0x68       # MPU9250 IMU
        self.ground_address = 0x60    # Ground sensors
        self.battery_address = 0x48   # Battery monitor
        
        # I2C register addresses for sensors
        self.sensor_registers = {
            'proximity': 0x10,        # Proximity sensors base register
            'light': 0x18,            # Light sensors base register
            'accel_x': 0x3B,         # Accelerometer X (IMU)
            'gyro_x': 0x43,          # Gyroscope X (IMU)
        }

    async def initialize(self) -> bool:
        """Initialize Pi-puck I2C sensor control"""
        if self._initialized:
            return True

        try:
            import smbus2
            
            # Try Pi-puck I2C buses 
            for bus_num in [12, 4, 11, 3]:  # Pi-puck standard buses
                try:
                    self.i2c_bus = smbus2.SMBus(bus_num)
                    
                    # Test communication with main e-puck controller
                    self.i2c_bus.read_byte(self.epuck_address)
                    
                    self.logger.info(f"✅ Sensor controller initialized on I2C bus {bus_num}")
                    self._initialized = True
                    return True
                    
                except Exception as bus_e:
                    if self.i2c_bus:
                        self.i2c_bus.close()
                        self.i2c_bus = None
                    continue

            self.logger.error("❌ No Pi-puck I2C bus found for sensor control")
            return False

        except ImportError:
            self.logger.error("❌ smbus2 not available for Pi-puck sensor control")
            return False
        except Exception as e:
            self.logger.error(f"❌ Sensor controller initialization failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup sensor resources"""
        if self._initialized:
            try:
                if self.i2c_bus:
                    self.i2c_bus.close()
                self.logger.info("🧹 Sensor controller cleaned up")
            except Exception as e:
                self.logger.warning(f"⚠️ Error during sensor cleanup: {e}")

        self._initialized = False
        self.i2c_bus = None

    async def get_proximity(self) -> List[int]:
        """Get proximity sensor readings (8 sensors) via Pi-puck I2C"""
        if not self._initialized or not self.i2c_bus:
            return [0] * 8

        try:
            # Read 8 proximity sensors from e-puck main controller
            proximity_data = self.i2c_bus.read_i2c_block_data(
                self.epuck_address, 
                self.sensor_registers['proximity'], 
                16  # 8 sensors x 2 bytes each
            )
            
            # Convert bytes to sensor values
            proximity = []
            for i in range(8):
                # Combine high and low bytes (little-endian)
                value = (proximity_data[i*2+1] << 8) | proximity_data[i*2]
                proximity.append(value)
                
            self.logger.debug(f"📡 Proximity sensors: {proximity}")
            return proximity
            
        except Exception as e:
            self.logger.warning(f"⚠️ Proximity sensor read failed: {e}")
            return [0] * 8

    async def get_light(self) -> List[int]:
        """Get light sensor readings (8 sensors) via Pi-puck I2C"""
        if not self._initialized or not self.i2c_bus:
            return [100] * 8

        try:
            # Read 8 light sensors from e-puck main controller
            light_data = self.i2c_bus.read_i2c_block_data(
                self.epuck_address,
                self.sensor_registers['light'],
                16  # 8 sensors x 2 bytes each
            )
            
            # Convert bytes to sensor values
            light = []
            for i in range(8):
                # Combine high and low bytes (little-endian)
                value = (light_data[i*2+1] << 8) | light_data[i*2]
                light.append(value)
                
            self.logger.debug(f"💡 Light sensors: {light}")
            return light
            
        except Exception as e:
            self.logger.warning(f"⚠️ Light sensor read failed: {e}")
            return [100] * 8

    async def get_accelerometer(self) -> List[float]:
        """Get accelerometer readings [x, y, z] from IMU"""
        if not self._initialized or not self.i2c_bus:
            return [0.0, 0.0, 9.8]

        try:
            # Try to read from IMU directly
            accel_data = self.i2c_bus.read_i2c_block_data(
                self.imu_address,
                self.sensor_registers['accel_x'],
                6  # 3 axes x 2 bytes each
            )
            
            # Convert bytes to accelerometer values (signed 16-bit)
            accel = []
            for i in range(3):
                # Combine high and low bytes (big-endian for IMU)
                raw_value = (accel_data[i*2] << 8) | accel_data[i*2+1]
                # Convert to signed 16-bit
                if raw_value > 32767:
                    raw_value -= 65536
                # Convert to g units (assuming ±2g range)
                accel_g = raw_value / 16384.0
                accel.append(accel_g)
                
            self.logger.debug(f"📐 Accelerometer: {accel}")
            return accel
            
        except Exception as e:
            self.logger.warning(f"⚠️ Accelerometer read failed: {e}")
            return [0.0, 0.0, 9.8]

    async def get_gyroscope(self) -> List[float]:
        """Get gyroscope readings [x, y, z] from IMU"""
        if not self._initialized or not self.i2c_bus:
            return [0.0, 0.0, 0.0]

        try:
            # Try to read from IMU directly  
            gyro_data = self.i2c_bus.read_i2c_block_data(
                self.imu_address,
                self.sensor_registers['gyro_x'],
                6  # 3 axes x 2 bytes each
            )
            
            # Convert bytes to gyroscope values (signed 16-bit)
            gyro = []
            for i in range(3):
                # Combine high and low bytes (big-endian for IMU)
                raw_value = (gyro_data[i*2] << 8) | gyro_data[i*2+1]
                # Convert to signed 16-bit
                if raw_value > 32767:
                    raw_value -= 65536
                # Convert to deg/s units (assuming ±250 deg/s range)
                gyro_dps = raw_value / 131.0
                gyro.append(gyro_dps)
                
            self.logger.debug(f"🌀 Gyroscope: {gyro}")
            return gyro
            
        except Exception as e:
            self.logger.warning(f"⚠️ Gyroscope read failed: {e}")
            return [0.0, 0.0, 0.0]

    async def get_microphone(self) -> float:
        """Get microphone level from e-puck"""
        if not self._initialized or not self.i2c_bus:
            return 0.0

        try:
            # Read microphone level from e-puck main controller
            mic_data = self.i2c_bus.read_i2c_block_data(
                self.epuck_address,
                0x20,  # Microphone register
                2
            )
            
            # Combine bytes to get microphone value
            mic_value = (mic_data[1] << 8) | mic_data[0]
            mic_level = mic_value / 1000.0  # Normalize
            
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
        if not self._initialized:
            return {"epuck": {"voltage": 3.7, "percentage": 75}, "external": {"voltage": 0.0, "percentage": 0}}

        try:
            # Read battery voltage via sysfs (as shown in Pi-puck examples)
            epuck_raw_path = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage0_raw"
            epuck_scale_path = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage0_scale"
            aux_raw_path = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage1_raw"
            aux_scale_path = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage1_scale"
            
            # Try legacy paths as fallback
            if not os.path.exists(epuck_raw_path):
                epuck_raw_path = "/sys/bus/i2c/devices/3-0048/iio:device0/in_voltage0_raw"
                epuck_scale_path = "/sys/bus/i2c/devices/3-0048/iio:device0/in_voltage0_scale"
                aux_raw_path = "/sys/bus/i2c/devices/3-0048/iio:device0/in_voltage1_raw"
                aux_scale_path = "/sys/bus/i2c/devices/3-0048/iio:device0/in_voltage1_scale"
            
            battery_info = {"epuck": {"voltage": 3.7, "percentage": 75}, "external": {"voltage": 0.0, "percentage": 0}}
            
            # Read e-puck battery
            if os.path.exists(epuck_raw_path) and os.path.exists(epuck_scale_path):
                with open(epuck_raw_path, 'r') as f:
                    epuck_raw = int(f.read().strip())
                with open(epuck_scale_path, 'r') as f:
                    epuck_scale = float(f.read().strip())
                    
                epuck_voltage = (epuck_raw * epuck_scale) / 1000.0  # Convert to volts
                epuck_percentage = max(0, min(100, ((epuck_voltage - 3.0) / (4.2 - 3.0)) * 100))
                
                battery_info["epuck"] = {"voltage": round(epuck_voltage, 2), "percentage": round(epuck_percentage)}
            
            # Read auxiliary battery  
            if os.path.exists(aux_raw_path) and os.path.exists(aux_scale_path):
                with open(aux_raw_path, 'r') as f:
                    aux_raw = int(f.read().strip())
                with open(aux_scale_path, 'r') as f:
                    aux_scale = float(f.read().strip())
                    
                aux_voltage = (aux_raw * aux_scale) / 1000.0  # Convert to volts
                aux_percentage = max(0, min(100, (aux_voltage / 12.0) * 100))  # Assuming 12V external
                
                battery_info["external"] = {"voltage": round(aux_voltage, 2), "percentage": round(aux_percentage)}
            
            self.logger.debug(f"🔋 Battery: {battery_info}")
            return battery_info
            
        except Exception as e:
            self.logger.warning(f"⚠️ Battery read failed: {e}")
            return {"epuck": {"voltage": 3.7, "percentage": 75}, "external": {"voltage": 0.0, "percentage": 0}}

    @property
    def is_initialized(self) -> bool:
        """Check if sensor controller is initialized"""
        return self._initialized