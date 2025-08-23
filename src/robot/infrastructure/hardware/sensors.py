"""Sensor control for e-puck2 robot - I2C sensors + ground detection"""

import asyncio
import logging
import os
from typing import List, Dict, Any
from application.interfaces.hardware.sensor_interface import SensorInterface
from domain.entities import SensorReading


class SensorController(SensorInterface):
    """E-puck2 sensor reading using I2C"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialized = False
    
    async def initialize(self) -> bool:
        """Initialize sensor controller"""
        if self._initialized:
            return True
        
        # No specific initialization needed for I2C sensors
        self._initialized = True
        self.logger.info("✅ Sensor controller initialized")
        return True
    
    async def cleanup(self):
        """Cleanup sensor resources"""
        if self._initialized:
            self.logger.info("🧹 Sensor controller cleaned up")
        self._initialized = False
    
    def _get_i2c_bus(self):
        """Get I2C bus with fallback channels"""
        import smbus2
        try:
            return smbus2.SMBus(12)  # Try channel 12 first
        except:
            return smbus2.SMBus(4)   # Fallback to channel 4
    
    async def get_proximity(self) -> List[int]:
        """Get proximity sensor readings using I2C"""
        if not self._initialized:
            raise RuntimeError("Sensor controller not initialized")
        
        try:
            import smbus2
            bus = self._get_i2c_bus()
            
            # E-puck2 has 8 proximity sensors
            prox_values = []
            for sensor_id in range(8):
                try:
                    # Read proximity sensor (approximate addresses)
                    sensor_addr = 0x58 + sensor_id
                    data = bus.read_byte_data(sensor_addr, 0)
                    prox_values.append(data)
                except:
                    prox_values.append(0)  # Sensor not available
            
            bus.close()
            return prox_values
            
        except ImportError:
            self.logger.warning("❌ smbus2 not available for proximity sensors")
            return [0] * 8
        except Exception as e:
            self.logger.warning(f"❌ Failed to read proximity sensors: {e}")
            return [0] * 8
    
    async def get_light(self) -> List[int]:
        """Get light sensor readings using I2C"""
        if not self._initialized:
            raise RuntimeError("Sensor controller not initialized")
        
        try:
            import smbus2
            bus = self._get_i2c_bus()
            
            # E-puck2 has 8 light sensors
            light_values = []
            for sensor_id in range(8):
                try:
                    # Read light sensor (approximate addresses)
                    sensor_addr = 0x50 + sensor_id
                    data = bus.read_byte_data(sensor_addr, 0)
                    light_values.append(data)
                except:
                    light_values.append(100)  # Default ambient light
            
            bus.close()
            return light_values
            
        except ImportError:
            self.logger.warning("❌ smbus2 not available for light sensors")
            return [100] * 8
        except Exception as e:
            self.logger.warning(f"❌ Failed to read light sensors: {e}")
            return [100] * 8
    
    async def get_accelerometer(self) -> List[float]:
        """Get accelerometer readings [x, y, z]"""
        imu_data = await self.get_imu_data()
        if "accelerometer" in imu_data:
            accel = imu_data["accelerometer"]
            return [accel["x"], accel["y"], accel["z"]]
        return [0.0, 0.0, 0.0]
    
    async def get_gyroscope(self) -> List[float]:
        """Get gyroscope readings [x, y, z]"""
        imu_data = await self.get_imu_data()
        if "gyroscope" in imu_data:
            gyro = imu_data["gyroscope"]
            return [gyro["x"], gyro["y"], gyro["z"]]
        return [0.0, 0.0, 0.0]
    
    async def get_microphone(self) -> float:
        """Get microphone level"""
        # TODO: Implement microphone reading
        return 0.0
    
    async def get_all_readings(self) -> SensorReading:
        """Get all sensor readings at once"""
        proximity = await self.get_proximity()
        light = await self.get_light()
        accelerometer = await self.get_accelerometer()
        gyroscope = await self.get_gyroscope()
        microphone = await self.get_microphone()
        
        import time
        return SensorReading(
            proximity=proximity,
            light=light,
            accelerometer=accelerometer,
            gyroscope=gyroscope,
            microphone=microphone,
            timestamp=time.time()
        )
    
    async def get_ground_sensors(self) -> List[int]:
        """Get ground sensor readings using Pi-puck I2C"""
        if not self._initialized:
            raise RuntimeError("Sensor controller not initialized")
        
        try:
            import smbus2
            bus = self._get_i2c_bus()
            
            # Read ground sensor at address 0x60
            data = bus.read_i2c_block_data(0x60, 0, 6)
            
            # Convert raw data to ground values (left, center, right)
            ground_left = (data[0] << 8) | data[1]
            ground_center = (data[2] << 8) | data[3]
            ground_right = (data[4] << 8) | data[5]
            
            bus.close()
            return [ground_left, ground_center, ground_right]
            
        except ImportError:
            self.logger.warning("❌ smbus2 not available for ground sensors")
            return [0, 0, 0]
        except Exception as e:
            self.logger.error(f"❌ Failed to read ground sensors: {e}")
            return [0, 0, 0]
    
    async def detect_ground_color(self, threshold: int = 1000) -> Dict[str, Any]:
        """Detect ground color changes (useful for colored tiles detection)"""
        if not self._initialized:
            raise RuntimeError("Sensor controller not initialized")
        
        try:
            # Get ground sensor readings
            ground_readings = await self.get_ground_sensors()
            
            # Analyze each sensor
            detection_result = {
                "left": {
                    "value": ground_readings[0],
                    "color": "white" if ground_readings[0] > threshold else "black",
                    "is_light": ground_readings[0] > threshold
                },
                "center": {
                    "value": ground_readings[1], 
                    "color": "white" if ground_readings[1] > threshold else "black",
                    "is_light": ground_readings[1] > threshold
                },
                "right": {
                    "value": ground_readings[2],
                    "color": "white" if ground_readings[2] > threshold else "black", 
                    "is_light": ground_readings[2] > threshold
                }
            }
            
            # Summary detection
            light_count = sum(1 for pos in detection_result.values() if pos["is_light"])
            detection_result["summary"] = {
                "light_sensors": light_count,
                "dark_sensors": 3 - light_count,
                "all_light": light_count == 3,
                "all_dark": light_count == 0,
                "mixed": 0 < light_count < 3
            }
            
            self.logger.debug(f"🔍 Ground color detection: {light_count}/3 light sensors")
            return detection_result
            
        except Exception as e:
            self.logger.error(f"❌ Failed to detect ground color: {e}")
            return {
                "left": {"value": 0, "color": "unknown", "is_light": False},
                "center": {"value": 0, "color": "unknown", "is_light": False},
                "right": {"value": 0, "color": "unknown", "is_light": False},
                "summary": {"light_sensors": 0, "dark_sensors": 0, "all_light": False, "all_dark": False, "mixed": False}
            }
    
    async def get_imu_data(self) -> Dict[str, Any]:
        """Get IMU sensor data using I2C"""
        if not self._initialized:
            raise RuntimeError("Sensor controller not initialized")
        
        try:
            import smbus2
            bus = self._get_i2c_bus()
            
            def read_reg(register):
                """Read 16-bit register value"""
                try:
                    regValue = bus.read_i2c_block_data(0x68, register, 2)
                    value = (regValue[0] << 8) | regValue[1]
                    # Convert to signed 16-bit
                    if value > 32767:
                        value -= 65536
                    return value
                except:
                    return 0
            
            # Read accelerometer data (registers 0x3B-0x40)
            accel_x = read_reg(0x3B)
            accel_y = read_reg(0x3D) 
            accel_z = read_reg(0x3F)
            
            # Read gyroscope data (registers 0x43-0x48)
            gyro_x = read_reg(0x43)
            gyro_y = read_reg(0x45)
            gyro_z = read_reg(0x47)
            
            bus.close()
            
            # Convert to standard units
            imu_data = {
                "accelerometer": {
                    "x": accel_x / 16384.0,  # Convert to g
                    "y": accel_y / 16384.0,
                    "z": accel_z / 16384.0
                },
                "gyroscope": {
                    "x": gyro_x / 131.0,  # Convert to degrees/second
                    "y": gyro_y / 131.0,
                    "z": gyro_z / 131.0
                }
            }
            
            return imu_data
            
        except ImportError:
            self.logger.warning("❌ smbus2 not available for IMU sensors")
            return {"error": "smbus2 not available"}
        except Exception as e:
            self.logger.error(f"❌ Failed to read IMU data: {e}")
            return {"error": str(e)}
    
    async def get_randb_sensors(self) -> dict:
        """Get range and bearing sensor data using I2C"""
        if not self._initialized:
            raise RuntimeError("Sensor controller not initialized")
        
        try:
            import smbus2
            bus = self._get_i2c_bus()
            
            def write_reg(register, data):
                """Write data to register"""
                try:
                    if isinstance(data, list):
                        bus.write_i2c_block_data(0x20, register, data)
                    else:
                        bus.write_byte_data(0x20, register, data)
                except Exception as e:
                    self.logger.debug(f"Failed to write randb register {register}: {e}")
            
            def read_reg(register, length=1):
                """Read data from register"""
                try:
                    if length == 1:
                        return bus.read_byte_data(0x20, register)
                    else:
                        return bus.read_i2c_block_data(0x20, register, length)
                except Exception as e:
                    self.logger.debug(f"Failed to read randb register {register}: {e}")
                    return 0 if length == 1 else [0] * length
            
            # Initialize randb sensor
            write_reg(12, [150])  # Set range
            write_reg(17, [0])    # Onboard calculation
            
            await asyncio.sleep(0.05)  # Wait for sensor to process
            
            # Check if data is available
            data_available = read_reg(0)
            
            randb_data = {
                "data_available": bool(data_available),
                "sensors": []
            }
            
            if data_available:
                # Read sensor data (up to 4 sensors typically)
                for sensor_id in range(4):
                    try:
                        # Read raw data for this sensor
                        reg_value = read_reg(sensor_id * 2 + 1, 2)
                        if len(reg_value) >= 2:
                            # Combine bytes to get randb data
                            raw_data = (reg_value[0] << 8) + reg_value[1]
                            
                            # Extract bearing and range
                            bearing = raw_data * 0.0001 if raw_data > 0 else 0
                            range_val = (raw_data >> 8) & 0xFF if raw_data > 0 else 0
                            
                            sensor_data = {
                                "sensor_id": sensor_id,
                                "raw_data": raw_data,
                                "bearing_degrees": bearing,
                                "range": range_val,
                                "detected": raw_data > 0
                            }
                            
                            randb_data["sensors"].append(sensor_data)
                            
                    except Exception as e:
                        self.logger.debug(f"Failed to read randb sensor {sensor_id}: {e}")
            
            bus.close()
            return randb_data
            
        except ImportError:
            self.logger.warning("❌ smbus2 not available for randb sensors")
            return {"error": "smbus2 not available", "sensors": []}
        except Exception as e:
            self.logger.error(f"❌ Failed to read randb sensors: {e}")
            return {"error": str(e), "sensors": []}
    
    async def get_battery_level(self) -> dict:
        """Get battery level using Pi-puck ADC reading"""
        try:
            # Detect correct ADC path
            adc_paths = [
                "/sys/bus/iio/devices/iio:device0/",
                "/sys/bus/iio/devices/iio:device1/",
                "/sys/class/hwmon/hwmon0/",
                "/sys/class/hwmon/hwmon1/"
            ]
            
            battery_info = {}
            
            for path in adc_paths:
                if os.path.exists(path):
                    try:
                        # Read scale and raw values
                        if os.path.exists(path + "in_voltage_scale"):
                            with open(path + "in_voltage_scale", 'r') as f:
                                scale = float(f.read().strip())
                        else:
                            scale = 1.0
                        
                        # Read e-puck battery (channel 3)
                        if os.path.exists(path + "in_voltage3_raw"):
                            with open(path + "in_voltage3_raw", 'r') as f:
                                epuck_raw = int(f.read().strip())
                            epuck_voltage = epuck_raw * scale / 1000.0
                            epuck_percent = max(0, min(100, int((epuck_voltage - 3.3) / (4.138 - 3.3) * 100)))
                            battery_info["epuck"] = {
                                "voltage": epuck_voltage,
                                "percentage": epuck_percent,
                                "raw": epuck_raw
                            }
                        
                        # Read external battery (channel 6)
                        if os.path.exists(path + "in_voltage6_raw"):
                            with open(path + "in_voltage6_raw", 'r') as f:
                                ext_raw = int(f.read().strip())
                            ext_voltage = ext_raw * scale / 1000.0
                            ext_percent = max(0, min(100, int((ext_voltage - 3.3) / (4.138 - 3.3) * 100)))
                            battery_info["external"] = {
                                "voltage": ext_voltage,
                                "percentage": ext_percent,
                                "raw": ext_raw
                            }
                        break
                        
                    except Exception as e:
                        self.logger.debug(f"Failed to read from {path}: {e}")
                        continue
            
            if not battery_info:
                # Fallback values
                battery_info = {
                    "epuck": {"voltage": 3.7, "percentage": 50, "raw": 0},
                    "external": {"voltage": 0.0, "percentage": 0, "raw": 0}
                }
            
            return battery_info
            
        except Exception as e:
            self.logger.error(f"❌ Failed to read battery level: {e}")
            return {
                "epuck": {"voltage": 0.0, "percentage": 0, "raw": 0},
                "external": {"voltage": 0.0, "percentage": 0, "raw": 0}
            }
    
    @property
    def is_initialized(self) -> bool:
        """Check if sensor controller is initialized"""
        return self._initialized