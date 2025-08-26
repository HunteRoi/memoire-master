"""EPuck2 robot interface via I2C communication. Based on documentation at: https://www.gctronic.com/doc/index.php?title=Pi-puck#Communicate_with_the_e-puck_version_2"""

from cv2 import VideoCapture, imwrite, IMWRITE_JPEG_QUALITY
import logging
from smbus2 import SMBus, i2c_msg
import struct
import time
from typing import List, Tuple, Optional, Any
from VL53L0X import VL53L0X, Vl53l0xAccuracyMode

from .bmm150 import *
from .actuators_builder import ActuatorsData, SOUND as BUILDER_SOUND, LED
from application.interfaces.hardware.epuck import EPuckInterface

# Common e-puck2 I2C address
I2C_CHANNEL                     = 12
LEGACY_I2C_CHANNEL              = 4

# IMU Registers using I2C channel and legacy I2C channel
IMU_ADDRESS_1                   = 0x68 # MPU9250 AD1 0
IMU_ADDRESS_2                   = 0x69 # MPU9250 AD1 1
ACCELEROMETER_REGISTRY          = 0x3B
GRAVITY_CORRECTOR               = 16384 # 1g = 16384 LSB for MPU9250
ACCELEROMETER_DATA_SIZE         = 6
ACCELEROMETER_VALUES_SIZE       = 3
GYROSCOPE_REGISTRY              = 0x43
GYROSCOPE_DATA_SIZE             = 6
GYROSCOPE_VALUES_SIZE           = 3

# EPuck2 Registers using I2C channel and legacy I2C channel
ROBOT_REGISTRY_ADDRESS          = 0x1f

## Actuator and sensor packet sizes
ACTUATORS_SIZE                  = 19 + 1 # 19 data bytes + 1 checksum

## sensors packet
PROXIMITY_DATA_SIZE             = 8
AMBIENT_LIGHT_DATA_SIZE         = 8
MICROPHONE_DATA_SIZE            = 4
MOTOR_STEPS_DATA_SIZE           = 2

PROXIMITY_DATA_TOTAL_SIZE       = 16
AMBIENT_LIGHT_DATA_TOTAL_SIZE   = 16
MICROPHONE_DATA_TOTAL_SIZE      = 8
SEL_AND_BUTTON_DATA_TOTAL_SIZE  = 1 # selector and button are on a single byte, 4 least significant bits for the selector, bit 4 for the button
MOTOR_STEPS_DATA_TOTAL_SIZE     = 4
REMOTE_TV_DATA_TOTAL_SIZE       = 1
SENSORS_SIZE                    = PROXIMITY_DATA_TOTAL_SIZE + AMBIENT_LIGHT_DATA_TOTAL_SIZE + MICROPHONE_DATA_TOTAL_SIZE + SEL_AND_BUTTON_DATA_TOTAL_SIZE + MOTOR_STEPS_DATA_TOTAL_SIZE + REMOTE_TV_DATA_TOTAL_SIZE + 1 # 46 data bytes + 1 checksum

## official sound IDs
SOUND_MARIO                     = 0x01
SOUND_UNDERWORLD                = 0x02
SOUND_STARWARS                  = 0x04
SOUND_TONE_4KHZ                 = 0x08
SOUND_TONE_10KHZ                = 0x10
SOUND_STOP                      = 0x20

# ToF Registers using I2C channel and legacy I2C channel
TOF_ADDRESS                     = 0x29 # VL53L0X

# Ground Sensors Registers using I2C channel and legacy I2C channel
GROUND_SENSORS_ADDRESS          = 0x60
GROUND_SENSORS_REGISTRY         = 0
GROUND_DATA_SIZE                = 6
GROUND_VALUES_SIZE              = 3

# Magnetometer Registers using BOARD I2C channel and legacy I2C channel
BOARD_I2C_CHANNEL               = 11
LEGACY_BOARD_I2C_CHANNEL        = 3
MAGNETOMETER_ADDRESS_0          = 0x10 # BMM150
MAGNETOMETER_ADDRESS_1          = 0x11
MAGNETOMETER_ADDRESS_2          = 0x12
MAGNETOMETER_ADDRESS_3          = 0x13

# Camera
OMNIVISION_CAMERA_ID            = 0
FRONT_CAMERA_ID                 = 1

class EPuck2(EPuckInterface):
    """Interface for the e-puck2 robot via I2C communication."""

    def __init__(self, i2c_bus: Optional[SMBus] = None, i2c_address: Optional[int] = None):
        """
        Initialize the EPuck2 interface.

        Args:
            i2c_bus: An instance of SMBus. If None, a new instance will be created based on (possibly legacy) I2C channel.
            i2c_address: I2C address of e-puck2 (default 0x1f).
        """
        self.logger = logging.getLogger(__name__)
        self._board_i2c_channels = [BOARD_I2C_CHANNEL, LEGACY_BOARD_I2C_CHANNEL]
        self._i2c_channels = [I2C_CHANNEL, LEGACY_I2C_CHANNEL] if i2c_bus is None else [i2c_bus]
        self._address = i2c_address if i2c_address is not None else ROBOT_REGISTRY_ADDRESS
        self._bus = None
        self._tof = None
        self._magnetometer = None
        self._initialized = False

        # Current state tracking for persistent actuators
        self._current_front_leds = False
        self._current_body_leds = {"LED2": [0, 0, 0], "LED4": [0, 0, 0], "LED6": [0, 0, 0], "LED8": [0, 0, 0]}
        self._current_left_speed = 0
        self._current_right_speed = 0

        self._reset_actuators_and_sensors()

    def _build_with_current_state(self) -> ActuatorsData:
        """Build ActuatorsData with current persistent state preserved."""
        builder = ActuatorsData()

        # Preserve motor speeds
        builder = builder.WithMotorSpeeds(self._current_left_speed, self._current_right_speed)

        # Preserve LED settings
        if self._current_front_leds:
            builder = builder.WithFrontLeds()

        # Preserve body LEDs
        for led_name, rgb in self._current_body_leds.items():
            if any(rgb):  # If any component is non-zero
                led_num = int(led_name[3:])  # Extract number from "LED2", "LED4", etc.
                led_map = {2: LED.LED2, 4: LED.LED4, 6: LED.LED6, 8: LED.LED8}
                if led_num in led_map:
                    builder = builder.WithBodyLeds(rgb[0], rgb[1], rgb[2], led_map[led_num])

        return builder

    def __del__(self):
        """ Destructor to ensure the I2C bus is closed properly."""
        self.close()

    def initialize(self) -> None:
        """ Initialize the I2C bus and verify communication with the robot."""
        if self._initialized:
            return
        self._initialize_bus()
        self._initialize_tof_sensor()
        self._initialize_magnetometer()
        if not self._initialized:
            raise ConnectionError("Could not connect to e-puck2 on any I2C channel.")

    def _initialize_magnetometer(self):
        magnetometer_addresses = [MAGNETOMETER_ADDRESS_0, MAGNETOMETER_ADDRESS_1, MAGNETOMETER_ADDRESS_2, MAGNETOMETER_ADDRESS_3]
        for channel in self._board_i2c_channels:
            for magnetometer_address in magnetometer_addresses:
                try:
                    self._magnetometer = bmm150_I2C(channel, magnetometer_address)
                    self.logger.info(f"🧡 Magnetometer connected at {hex(magnetometer_address)} on I2C channel {channel}")
                    break
                except Exception as e:
                    self._magnetometer = None
                    self.logger.warning(f"⚠️ Magnetometer connection failed on channel {channel}: {e}")
            if self._magnetometer is not None:
                break

    def _initialize_tof_sensor(self):
        for channel in self._i2c_channels:
            try:
                self._tof = VL53L0X(i2c_bus=channel, i2c_address=TOF_ADDRESS)
                self.logger.info(f"📶 ToF sensor connected at {hex(TOF_ADDRESS)} on I2C channel {channel}")
                break
            except Exception as e:
                self.logger.warning(f"⚠️ ToF sensor connection failed on channel {channel}: {e}")

    def _initialize_bus(self):
        for channel in self._i2c_channels:
            try:
                self._bus = channel if isinstance(channel, SMBus) else SMBus(channel)
                self._actuators_data = bytearray([0] * ACTUATORS_SIZE)
                self._sensors_data = bytearray([0] * SENSORS_SIZE)
                self._initialized = True
                self._update_sensors_and_actuators()
                self.logger.info(f"🤖 e-puck2 connected at {hex(self._address)} on I2C channel {channel}")
                break
            except Exception as e:
                self.logger.error(f"❌ e-puck2 I2C connection failed on channel {channel}: {e}")
                self._bus = None

    def close(self) -> None:
        """ Close the I2C bus if it was opened by this instance."""
        if self._bus is not None:
            try:
                self.logger.info("🧹 EPuck2 cleanup initiated - shutting down all hardware")
                self._reset_actuators_and_sensors()
                self._update_sensors_and_actuators()
                self.logger.info("✅ EPuck2 cleanup completed - all hardware shut down")
            except Exception as cleanup_error:
                self.logger.warning(f"⚠️ EPuck2 cleanup failed - hardware may remain active: {cleanup_error}")
            finally:
                self._bus.close()
                self._bus = None
                self._initialized = False

        if self._tof is not None:
            self._tof.close()
            self._tof = None

    def _calculate_checksum(self, data: List) -> int:
        size = len(data)
        checksum = 0
        for i in range(size-1):
            checksum ^= data[i]
        return checksum

    def _update_sensors_and_actuators(self) -> None:
        """
        Send the actuator command packet to the robot (and read back the sensor data) from specific fields:
        Left speed (2)	Right speed (2)	Speaker (1)	LED1, LED3, LED5, LED7 (1)	LED2 RGB (3)	LED4 RGB (3)	LED6 RGB (3)	LED8 RGB (3)	Settings (1)	Checksum (1)

        Source: https://github.com/gctronic/Pi-puck/blob/master/e-puck2/e-puck2_test.py

        Docs: https://www.gctronic.com/doc/index.php?title=Pi-puck#Packet_format
        """
        if not self._initialized or self._bus is None:
            raise RuntimeError("EPuck2 is not initialized. Call initialize() before sending packets.")

        self._actuators_data[ACTUATORS_SIZE-1] = self._calculate_checksum(self._actuators_data)

        write = i2c_msg.write(self._address, self._actuators_data)
        hex_data = ' '.join([f'{b:02x}' for b in self._actuators_data])
        self.logger.debug(f"📤 Actuator data sent ({len(self._actuators_data)} bytes): {hex_data}")

        read = i2c_msg.read(self._address, SENSORS_SIZE)
        self.logger.debug("🔍 Awaiting sensor data response...")

        try:
            self._bus.i2c_rdwr(write, read)
            self._sensors_data = list(read)
            self.logger.debug(f"🔄 I2C transaction complete: {len(self._sensors_data)} bytes sensor data received")
        except Exception as e:
            raise ConnectionError(f"Failed to communicate with e-puck2: {e}")

    def _reset_actuators_and_sensors(self) -> None:
        self._actuators_data = bytearray([0] * ACTUATORS_SIZE)                  # Actuator command buffer
        self._sensors_data = bytearray([0] * SENSORS_SIZE)                      # Sensor data buffer

    def _parse_sensors_data(self) -> Tuple[List[int], List[int], List[int], int, int, List[int], int]:
        """
        Parse the sensor data into divided specific fields:
        8 x Prox (16)   8 x Ambient (16)	4 x Mic (8)	Selector + button (1)	Left steps (2)	Right steps (2)	TV remote (1)	Checksum

        Source: https://github.com/gctronic/Pi-puck/blob/master/e-puck2/e-puck2_test.py

        Docs: https://www.gctronic.com/doc/index.php?title=Pi-puck#Packet_format
        """
        offset = 0
        proximity = [0 for x in range(PROXIMITY_DATA_SIZE)]
        proximity_ambient = [0 for x in range(AMBIENT_LIGHT_DATA_SIZE)]
        microphone = [0 for x in range(MICROPHONE_DATA_SIZE)]
        selector = 0
        button = 0
        motor_steps = [0 for x in range(MOTOR_STEPS_DATA_SIZE)]
        tv_remote = 0

        checksum = self._calculate_checksum(self._sensors_data)
        if (checksum != self._sensors_data[SENSORS_SIZE-1]):
            return

        for i in range(PROXIMITY_DATA_SIZE):
            proximity[i] = self._sensors_data[i*2+1] * 256 + self._sensors_data[i*2]
        offset += PROXIMITY_DATA_TOTAL_SIZE
        for i in range(AMBIENT_LIGHT_DATA_SIZE):
            proximity_ambient[i] = self._sensors_data[offset+i*2+1] * 256 + self._sensors_data[offset+i*2]
        offset += AMBIENT_LIGHT_DATA_TOTAL_SIZE
        for i in range(MICROPHONE_DATA_SIZE):
            microphone[i] = self._sensors_data[offset+i*2+1] * 256 + self._sensors_data[offset+i*2]
        offset += MICROPHONE_DATA_TOTAL_SIZE
        selector = self._sensors_data[offset] & 0x0F # 4 least significant bits
        button = self._sensors_data[offset] >> 4     # bit 4
        offset += SEL_AND_BUTTON_DATA_TOTAL_SIZE
        for i in range(MOTOR_STEPS_DATA_SIZE):
            motor_steps[i] = self._sensors_data[offset+i*2+1] * 256 + self._sensors_data[offset+i*2]
        offset += MOTOR_STEPS_DATA_TOTAL_SIZE
        tv_remote = self._sensors_data[offset]

        return proximity, proximity_ambient, microphone, selector, button, motor_steps, tv_remote

    def _read_tof_sensor(self) -> List[int]:
        """
        Read the Time-of-Flight sensor data and return the distances (in millimeters) as a list.

        Source:https://github.com/gctronic/Pi-puck/blob/master/e-puck2/VL53L0X_example.py
        """
        if self._tof is None:
            raise RuntimeError("ToF sensor is not initialized")

        distance_in_millimeters = [0 for x in range(1, 101)]
        try:
            self._tof.start_ranging(Vl53l0xAccuracyMode.BETTER)
            timing = self._tof.get_timing()
            if timing < 20000:
                timing = 20000

            for i in range (1, 101):
                caught_distance = self._tof.get_distance()
                distance_in_millimeters[i] = caught_distance if caught_distance > 0 else 0
                time.sleep(timing/1000000.00)

            self._tof.stop_ranging()
        except Exception as e:
            self.logger.error(f"❌ ToF sensor read failed - distance unavailable: {e}")

        return distance_in_millimeters

    def _read_ground_sensors(self) -> List[int]:
        """
        Read ground sensors data and return them in a list: [left_sensor, center_sensor, right_sensor].

        Source: https://github.com/gctronic/Pi-puck/blob/master/ground-sensor/groundsensor.py
        """
        if not self._initialized or self._bus is None:
            raise RuntimeError("EPuck2 is not initialized. Call initialize() before sending packets.")

        ground_data = bytearray([0] * GROUND_DATA_SIZE)
        ground_values = [0 for x in range(GROUND_VALUES_SIZE)]
        try:
            ground_data = self._bus.read_i2c_block_data(GROUND_SENSORS_ADDRESS, GROUND_SENSORS_REGISTRY, GROUND_DATA_SIZE)
        except Exception as e:
            self.logger.error(f"❌ Ground sensor read failed - surface detection unavailable: {e}")

        # shift high byte by 8 to reconstruct the full sensor data in a 16bits integer
        ground_values[0] = ground_data[1] + (ground_data[0] << 8) # left ground sensor
        ground_values[1] = ground_data[3] + (ground_data[2] << 8) # center ground sensor
        ground_values[2] = ground_data[5] + (ground_data[4] << 8) # right ground sensor
        self.logger.debug(f"🌱 Ground sensors: L={ground_values[0]:>3d}, C={ground_values[1]:>3d}, R={ground_values[2]:>3d}")

        return ground_values

    def _read_magnetometer(self) -> Tuple[int, int, int, float]:
        """
        Read the magnetometer values and return them in a tuple (x,y,z,degree).

        Source: https://github.com/gctronic/Pi-puck/blob/master/magnetometer/python/get_geomagnetic_data.py
        """
        if self.magnetometer is None:
            raise RuntimeError("Magnetometer sensor is not initialized")
        try:
            while self._magnetometer.sensor_init() == bmm150.ERROR:
                self.logger.debug("⚠️ Magnetometer init failed, retrying in 1s...")
                time.sleep(1)
            self._magnetometer.set_operation_mode(bmm150.POWERMODE_NORMAL)
            self._magnetometer.set_preset_mode(bmm150.PRESETMODE_HIGHACCURACY)
            self._magnetometer.set_rate(bmm150.RATE_10HZ)
            self._magnetometer.set_measurement_xyz()

            # calibrate magnetometer
            self.logger.debug("🤖 Calibrating magnetometer - please move robot in figure-8 pattern")
            geo_offsets_max = [-1000, -1000, -1000]
            geo_offsets_min = [1000, 1000, 1000]
            geo_offsets = [0, 0, 0]
            loop_count = 0
            out = open("./bmm150/calibration.csv", "w")
            while loop_count < 100:
                geomagnetic = self._magnetometer.get_geomagnetic()
                out.write(str(geomagnetic[0]) + "," + str(geomagnetic[1]) + "," + str(geomagnetic[2]) + "\n")
                if(geo_offsets_max[0] < geomagnetic[0]):
                    geo_offsets_max[0] = geomagnetic[0]
                if(geo_offsets_max[1] < geomagnetic[1]):
                    geo_offsets_max[1] = geomagnetic[1]
                if(geo_offsets_max[2] < geomagnetic[2]):
                    geo_offsets_max[2] = geomagnetic[2]
                if(geo_offsets_min[0] > geomagnetic[0]):
                    geo_offsets_min[0] = geomagnetic[0]
                if(geo_offsets_min[1] > geomagnetic[1]):
                    geo_offsets_min[1] = geomagnetic[1]
                if(geo_offsets_min[2] > geomagnetic[2]):
                    geo_offsets_min[2] = geomagnetic[2]
                loop_count = loop_count + 1
                time.sleep(0.1)
            out.close()
            geo_offsets[0] = (geo_offsets_max[0] + geo_offsets_min[0])/2
            geo_offsets[1] = (geo_offsets_max[1] + geo_offsets_min[1])/2
            geo_offsets[2] = (geo_offsets_max[2] + geo_offsets_min[2])/2
            self.logger.debug(f"🧡 Magnetometer geo offsets calculated: {geo_offsets}")
            self.logger.debug("✅ Magnetometer calibration completed")

            def get_robot_degree():
                geomagnetic = self._magnetometer.get_geomagnetic()
                compass = math.atan2(geomagnetic[0]-geo_offsets[0], geomagnetic[1]-geo_offsets[1])
                #correct the sensor orientation respect to the robot (90 degrees)
                compass = compass - (math.pi/2)
                if compass < 0:
                    compass += 2 * math.pi
                if compass > 2 * math.pi:
                    compass -= 2 * math.pi
                return compass * 180 / math.pi

            geomagnetic = self._magnetometer.get_geomagnetic()
            degree = get_robot_degree()
            return geomagnetic[0], geomagnetic[1], geomagnetic[3], degree # (x,y,z,degree)
        except Exception as e:
            self.logger.error(f"❌ Magnetometer operation failed - compass unavailable: {e}")
            return tuple(0,0,0,0)
        finally:
            self._magnetometer.set_operation_mode(bmm150.POWERMODE_SLEEP)

    def _get_camera_snapshot(self, device_id: int = 1) -> str:
        """
        Get an image snapshot from one of the camera (front or omnivision).

        Source: https://github.com/gctronic/Pi-puck/blob/master/snapshot/snapshot.py
        """
        if device_id not in [FRONT_CAMERA_ID, OMNIVISION_CAMERA_ID]:
            raise RuntimeError("Provided camera ID is not supported. Use FRONT_CAMERA_ID or OMNIVISION_CAMERA_ID instead.")

        try:
            image_path = f"./snapshots/image{time.time_ns()}.jpg"

            camera = VideoCapture(device_id)
            _, frame = camera.read()
            imwrite(image_path, frame, [int(IMWRITE_JPEG_QUALITY), 70])

            return image_path
        except Exception as e:
            self.logger.error(f"❌ Camera snapshot failed on device {device_id}: {e}")

    def _get_imu_sensors(self):
        """
        Read IMU sensors data and return them in a tuple ((accel_x, accel_y, accel_z, divider),(gyro_x, gyro_y, gyro_z, divider))
        The divider can be used on acceleration/gyroscope values to make them more humanily readable.
        Acceleration unit is g. Gyroscope unit is dps.

        Source: https://github.com/gctronic/Pi-puck/blob/master/e-puck2/e-puck2_imu.py
        """
        if not self._initialized or self._bus is None:
            raise RuntimeError("EPuck2 is not initialized. Call initialize() before sending packets.")

        acceleration_data = bytearray([0] * ACCELEROMETER_DATA_SIZE)
        gyroscope_data = bytearray([0] * GYROSCOPE_DATA_SIZE)
        acceleration_values = [0 for x in range(ACCELEROMETER_VALUES_SIZE)]
        acceleration_sum = [0 for x in range(ACCELEROMETER_VALUES_SIZE)]
        acceleration_offset = [0 for x in range(ACCELEROMETER_VALUES_SIZE)]
        acceleration_divider = 32768.0*2.0
        gyroscope_values = [0 for x in range(GYROSCOPE_VALUES_SIZE)]
        gyroscope_sum = [0 for x in range(GYROSCOPE_VALUES_SIZE)]
        gyroscope_offset = [0 for x in range(GYROSCOPE_VALUES_SIZE)]
        gyroscope_divider = 32768.0*250.0

        def read_registry(registry, count):
            imu_addresses = [IMU_ADDRESS_1, IMU_ADDRESS_2]
            data = None
            for address in imu_addresses:
                try:
                    data = self._bus.read_i2c_block_data(address, registry, count)
                except Exception as e:
                    data = None
                    self.logger.error(f"❌ IMU sensor read failed from address {address}")
            return data

        try:
            calibration_total_samples = 20
            # calibrate accelerometer
            samples_count = 0
            for _ in range(calibration_total_samples):
                acceleration_data = read_registry(ACCELEROMETER_REGISTRY, ACCELEROMETER_DATA_SIZE)
                if acceleration_data is not None:
                    acceleration_sum[0] += struct.unpack("<h", struct.pack("<BB", acceleration_data[1], acceleration_data[0]))[0]
                    acceleration_sum[1] += struct.unpack("<h", struct.pack("<BB", acceleration_data[3], acceleration_data[2]))[0]
                    acceleration_sum[2] += struct.unpack("<h", struct.pack("<BB", acceleration_data[5], acceleration_data[4]))[0] - GRAVITY_CORRECTOR
                    samples_count += 1
                time.sleep(0.050)
            acceleration_offset[0] = int(acceleration_sum[0]/samples_count)
            acceleration_offset[1] = int(acceleration_sum[1]/samples_count)
            acceleration_offset[2] = int(acceleration_sum[2]/samples_count)
            self.logger.debug(f"📀 Accelerometer offsets: X={acceleration_offset[0]:>+5d}, Y={acceleration_offset[1]:>+5d}, Z={acceleration_offset[2]:>+5d} ({samples_count} samples)")

            # calibration gyroscope
            samples_count = 0
            for _ in range(calibration_total_samples):
                gyroscope_data = read_registry(GYROSCOPE_REGISTRY, GYROSCOPE_DATA_SIZE)
                if gyroscope_data is not None:
                    gyroscope_sum[0] += struct.unpack("<h", struct.pack("<BB", gyroscope_data[1], gyroscope_data[0]))[0]
                    gyroscope_sum[1] += struct.unpack("<h", struct.pack("<BB", gyroscope_data[3], gyroscope_data[2]))[0]
                    gyroscope_sum[2] += struct.unpack("<h", struct.pack("<BB", gyroscope_data[5], gyroscope_data[4]))[0]
                    samples_count += 1
                time.sleep(0.050)
            gyroscope_offset[0] = int(gyroscope_sum[0]/samples_count)
            gyroscope_offset[1] = int(gyroscope_sum[1]/samples_count)
            gyroscope_offset[2] = int(gyroscope_sum[2]/samples_count)
            self.logger.debug(f"🌀 Gyroscope offsets: X={gyroscope_offset[0]:>+5d}, Y={gyroscope_offset[1]:>+5d}, Z={gyroscope_offset[2]:>+5d} ({samples_count} samples)")

            acceleration_data = read_registry(ACCELEROMETER_REGISTRY, ACCELEROMETER_DATA_SIZE)
            acceleration_values[0] = struct.unpack("<h", struct.pack("<BB", acceleration_data[1], acceleration_data[0]))[0] - acceleration_offset[0]
            acceleration_values[1] = struct.unpack("<h", struct.pack("<BB", acceleration_data[3], acceleration_data[2]))[0] - acceleration_offset[1]
            acceleration_values[2] = struct.unpack("<h", struct.pack("<BB", acceleration_data[5], acceleration_data[4]))[0] - acceleration_offset[2]

            gyroscope_data = read_registry(GYROSCOPE_REGISTRY, GYROSCOPE_DATA_SIZE)
            gyroscope_values[0] = struct.unpack("<h", struct.pack("<BB", gyroscope_data[1], gyroscope_data[0]))[0] - gyroscope_offset[0]
            gyroscope_values[1] = struct.unpack("<h", struct.pack("<BB", gyroscope_data[3], gyroscope_data[2]))[0] - gyroscope_offset[1]
            gyroscope_values[2] = struct.unpack("<h", struct.pack("<BB", gyroscope_data[5], gyroscope_data[4]))[0] - gyroscope_offset[2]

            return (acceleration_values[0], acceleration_values[1], acceleration_values[2], acceleration_divider), (gyroscope_values[0], gyroscope_values[1], gyroscope_values[2], gyroscope_divider)
        except Exception as e:
            self.logger.error(f"❌ IMU sensor calibration failed - motion sensing unavailable: {e}")

#################################################
#           EPUCK2 SPECIFIC METHODS             #
#################################################

# Actuators
## Motors
    def go_forward(self, speed: int) -> None:
        """Set both motors to move forward at the specified speed."""
        self._current_left_speed = speed
        self._current_right_speed = speed
        actuator_data = ActuatorsData().MoveForward(speed).Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def go_backward(self, speed: int) -> None:
        """Set both motors to move backward at the specified speed."""
        self._current_left_speed = -speed
        self._current_right_speed = -speed
        actuator_data = ActuatorsData().MoveBackward(speed).Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def turn_left(self, speed: int) -> None:
        """Set motors to turn left at the specified speed."""
        self._current_left_speed = -speed
        self._current_right_speed = speed
        actuator_data = ActuatorsData().TurnLeft(speed).Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def turn_right(self, speed: int) -> None:
        """Set motors to turn right at the specified speed."""
        self._current_left_speed = speed
        self._current_right_speed = -speed
        actuator_data = ActuatorsData().TurnRight(speed).Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def set_motor_control_mode(self, position_mode: bool) -> None:
        """Set motor control mode: True for position mode, False for speed mode."""
        builder = self._build_with_current_state()
        if position_mode:
            builder = builder.WithPositionMode()
        else:
            builder = builder.WithSpeedMode()

        actuator_data = builder.Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def toggle_obstacle_avoidance(self) -> None:
        """Toggle the obstacle avoidance feature."""
        raise NotImplementedError("Obstacle avoidance toggle not implemented yet.")

## LEDs
    def enable_front_leds(self) -> None:
        """Enable the front LEDs."""
        self._current_front_leds = True
        builder = self._build_with_current_state()
        actuator_data = builder.WithFrontLeds().Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def disable_front_leds(self) -> None:
        """Disable the front LEDs."""
        self._current_front_leds = False
        builder = self._build_with_current_state()
        actuator_data = builder.WithoutFrontLeds().Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def enable_body_leds(self) -> None:
        """Enable the body LEDs."""
        # Set all body LEDs to white (max brightness)
        for led_name in self._current_body_leds:
            self._current_body_leds[led_name] = [100, 100, 100]

        builder = self._build_with_current_state()
        actuator_data = builder.WithWhiteBodyLeds().Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def disable_body_leds(self) -> None:
        """Disable the body LEDs."""
        # Set all body LEDs to off
        for led_name in self._current_body_leds:
            self._current_body_leds[led_name] = [0, 0, 0]

        builder = self._build_with_current_state()
        actuator_data = builder.WithoutBodyLeds().Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def set_body_led_rgb(self, red: int, green: int, blue: int, led: int = None) -> None:
        """Set the RGB color of the body LED. If led is None, set all body LEDs."""
        # Convert led number to LED enum
        led_enum = None
        if led is not None:
            led_map = {2: LED.LED2, 4: LED.LED4, 6: LED.LED6, 8: LED.LED8}
            led_enum = led_map.get(led)

        # Update internal state
        if led is None:
            # Set all body LEDs
            for led_name in self._current_body_leds:
                self._current_body_leds[led_name] = [red, green, blue]
        else:
            led_name = f"LED{led}"
            if led_name in self._current_body_leds:
                self._current_body_leds[led_name] = [red, green, blue]

        builder = self._build_with_current_state()
        actuator_data = builder.WithBodyLeds(red, green, blue, led_enum).Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

## Sound
    def play_sound(self, sound_id: int) -> None:
        """Play a predefined sound on the e-puck2."""
        builder = self._build_with_current_state()
        actuator_data = builder.WithSound(BUILDER_SOUND(sound_id)).Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def stop_sound(self) -> None:
        """Stop any currently playing sound."""
        self.play_sound(SOUND_STOP)

    def play_mario(self) -> None:
        """Play the Mario theme."""
        self.play_sound(SOUND_MARIO)

    def play_underworld(self) -> None:
        """Play the Underworld theme."""
        self.play_sound(SOUND_UNDERWORLD)

    def play_starwars(self) -> None:
        """Play the Star Wars theme."""
        self.play_sound(SOUND_STARWARS)

    def play_tone_4khz(self) -> None:
        """Play a 4kHz tone."""
        self.play_sound(SOUND_TONE_4KHZ)

    def play_tone_10khz(self) -> None:
        """Play a 10kHz tone."""
        self.play_sound(SOUND_TONE_10KHZ)

# Sensors
## Proximity and Ambient Light
    def calibrate_ir_sensors(self) -> None:
        """Calibrate the IR sensors."""
        builder = self._build_with_current_state()
        actuator_data = builder.WithSensorCalibration(True).Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def read_proximity_sensors(self) -> List[int]:
        """Read and return the proximity sensor values."""
        try:
            parsed_data = self._parse_sensors_data()
            if parsed_data:
                proximity, _, _, _, _, _, _ = parsed_data
                return proximity
            return [0] * PROXIMITY_DATA_SIZE
        except Exception as e:
            self.logger.error(f"❌ Proximity sensors read failed - obstacle detection unavailable: {e}")
            return [0] * PROXIMITY_DATA_SIZE

    def read_ambient_light_sensors(self) -> List[int]:
        """Read and return the ambient light sensor values."""
        try:
            parsed_data = self._parse_sensors_data()
            if parsed_data:
                _, proximity_ambient, _, _, _, _, _ = parsed_data
                return proximity_ambient
            return [0] * AMBIENT_LIGHT_DATA_SIZE
        except Exception as e:
            self.logger.error(f"❌ Ambient light sensors read failed - light detection unavailable: {e}")
            return [0] * AMBIENT_LIGHT_DATA_SIZE

## Camera
    def take_picture_with_front_camera(self) -> None:
        """Capture a snapshot with the front camera"""
        img_path = self._get_camera_snapshot(FRONT_CAMERA_ID)
        self.logger.debug(f"📷 Camera snapshot saved: {img_path}")

    def take_picture_with_omnivision_camera(self) -> None:
        """Capture a snapshot with the 360° camera (OmniVision3 module)"""
        img_path = self._get_camera_snapshot(OMNIVISION_CAMERA_ID)
        self.logger.debug(f"📷 Camera snapshot saved: {img_path}")

## Microphone
    def read_microphone_sensors(self) -> List[int]:
        """Read and return the microphone sensor values"""
        try:
            parsed_data = self._parse_sensors_data()
            if parsed_data:
                _, _, microphone, _, _, _, _ = parsed_data
                return microphone
            return [0] * MICROPHONE_DATA_SIZE
        except Exception as e:
            self.logger.error(f"❌ Microphone sensors read failed - sound detection unavailable: {e}")
            return [0] * MICROPHONE_DATA_SIZE

## IMU
    def get_accelerometer(self) -> Tuple[float, float, float]:
        """Get accelerometer readings (x, y, z)."""
        try:
            imu_data = self._get_imu_sensors()
            if imu_data:
                accel_data, _ = imu_data
                x, y, z, divider = accel_data
                return (x / divider, y / divider, z / divider)
            return (0.0, 0.0, 0.0)
        except Exception as e:
            self.logger.error(f"❌ Accelerometer read failed - motion detection unavailable: {e}")
            return (0.0, 0.0, 0.0)

    @property
    def accelerometer(self) -> Tuple[float, float, float]:
        """Get accelerometer readings (x, y, z)."""
        return self.get_accelerometer()

    def get_gyroscope(self) -> Tuple[float, float, float]:
        """Get gyroscope readings (x, y, z)."""
        try:
            imu_data = self._get_imu_sensors()
            if imu_data:
                _, gyro_data = imu_data
                x, y, z, divider = gyro_data
                return (x / divider, y / divider, z / divider)
            return (0.0, 0.0, 0.0)
        except Exception as e:
            self.logger.error(f"❌ Gyroscope read failed - rotation detection unavailable: {e}")
            return (0.0, 0.0, 0.0)

    @property
    def gyroscope(self) -> Tuple[float, float, float]:
        """Get gyroscope readings (x, y, z)."""
        return self.get_gyroscope()

    def get_magnetometer(self) -> Tuple[float, float, float]:
        """Get magnetometer readings (x, y, z)."""
        try:
            mag_data = self._read_magnetometer()
            if mag_data:
                x, y, z, _ = mag_data
                return (float(x), float(y), float(z))
            return (0.0, 0.0, 0.0)
        except Exception as e:
            self.logger.error(f"❌ Magnetometer read failed - compass unavailable: {e}")
            return (0.0, 0.0, 0.0)

    @property
    def magnetometer(self) -> Tuple[float, float, float]:
        """Get magnetometer readings (x, y, z)."""
        return self.get_magnetometer()


#################################################
#           EPUCK1 SPECIFIC METHODS             #
#   For compatibility with e-puck1 legacy code  #
#################################################

# Actuators
## Motors
    def set_left_motor_speed(self, speed):
        """EPuck1 compatibility: Set left motor speed."""
        self._current_left_speed = speed
        # Keep right motor at current speed (to preserve existing behavior)
        builder = self._build_with_current_state()
        actuator_data = builder.Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def set_right_motor_speed(self, speed):
        """EPuck1 compatibility: Set right motor speed."""
        self._current_right_speed = speed
        # Keep left motor at current speed (to preserve existing behavior)
        builder = self._build_with_current_state()
        actuator_data = builder.Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    def set_motor_speeds(self, speed_left, speed_right):
        """EPuck1 compatibility: Set both motor speeds."""
        self._current_left_speed = speed_left
        self._current_right_speed = speed_right
        builder = self._build_with_current_state()
        actuator_data = builder.Build()
        self._actuators_data = actuator_data
        self._update_sensors_and_actuators()

    @property
    def left_motor_speed(self):
        """EPuck1 compatibility: Get current left motor speed."""
        return self._current_left_speed

    @property
    def right_motor_speed(self):
        """EPuck1 compatibility: Get current right motor speed."""
        return self._current_right_speed

    @property
    def motor_speeds(self):
        """EPuck1 compatibility: Get current motor speeds as tuple."""
        return (self._current_left_speed, self._current_right_speed)

    @property
    def left_motor_steps(self):
        """EPuck1 compatibility: Get left motor encoder steps."""
        try:
            parsed_data = self._parse_sensors_data()
            if parsed_data:
                _, _, _, _, _, motor_steps, _ = parsed_data
                return motor_steps[0]
            return 0
        except Exception as e:
            self.logger.error(f"❌ Left motor encoder read failed - position tracking unavailable: {e}")
            return 0

    @property
    def right_motor_steps(self):
        """EPuck1 compatibility: Get right motor encoder steps."""
        try:
            parsed_data = self._parse_sensors_data()
            if parsed_data:
                _, _, _, _, _, motor_steps, _ = parsed_data
                return motor_steps[1]
            return 0
        except Exception as e:
            self.logger.error(f"❌ Right motor encoder read failed - position tracking unavailable: {e}")
            return 0

    @property
    def motor_steps(self):
        """EPuck1 compatibility: Get motor encoder steps as tuple."""
        return (self.left_motor_steps, self.right_motor_steps)

## LEDs
    def set_outer_leds_byte(self, leds):
        """EPuck1 compatibility: Set outer LEDs using byte value."""
        # Extract individual LED states from byte
        led_states = [(leds >> i) & 1 for i in range(8)]
        self.set_outer_leds(*led_states)

    def set_outer_leds(self, led0, led1, led2, led3, led4, led5, led6, led7):
        """EPuck1 compatibility: Set all 8 outer LEDs individually."""
        # Map to body LEDs (LEDs 2,4,6,8 are the main body LEDs)
        if led1:  # LED1 -> LED2
            self.set_body_led_rgb(100, 100, 100, 2)
        else:
            self.set_body_led_rgb(0, 0, 0, 2)

        if led3:  # LED3 -> LED4
            self.set_body_led_rgb(100, 100, 100, 4)
        else:
            self.set_body_led_rgb(0, 0, 0, 4)

        if led5:  # LED5 -> LED6
            self.set_body_led_rgb(100, 100, 100, 6)
        else:
            self.set_body_led_rgb(0, 0, 0, 6)

        if led7:  # LED7 -> LED8
            self.set_body_led_rgb(100, 100, 100, 8)
        else:
            self.set_body_led_rgb(0, 0, 0, 8)

    def set_inner_leds(self, front, body):
        """EPuck1 compatibility: Set inner LEDs (front and body)."""
        if front:
            self.enable_front_leds()
        else:
            self.disable_front_leds()

        if body:
            self.enable_body_leds()
        else:
            self.disable_body_leds()

# Sensors
## Miscellaneous
    def enable_ir_sensors(self, enabled):
        """EPuck1 compatibility: Enable/disable IR sensors (calibrates if enabled)."""
        if enabled:
            self.calibrate_ir_sensors()

    def get_ir_reflected(self, sensor):
        """EPuck1 compatibility: Get proximity sensor value by index."""
        proximity_values = self.read_proximity_sensors()
        if 0 <= sensor < len(proximity_values):
            return proximity_values[sensor]
        return 0

    @property
    def ir_reflected(self):
        """EPuck1 compatibility: Get all proximity sensor values."""
        return self.read_proximity_sensors()

    def get_ir_ambient(self, sensor):
        """EPuck1 compatibility: Get ambient light sensor value by index."""
        ambient_values = self.read_ambient_light_sensors()
        if 0 <= sensor < len(ambient_values):
            return ambient_values[sensor]
        return 0

    @property
    def ir_ambient(self):
        """EPuck1 compatibility: Get all ambient light sensor values."""
        return self.read_ambient_light_sensors()

    def get_ground_sensors(self):
        """Get ground sensor values [left, center, right]."""
        return self._read_ground_sensors()

    @property
    def ground_sensors(self):
        """Get all ground sensor values [left, center, right]."""
        return self._read_ground_sensors()

#################################################
#            EPUCK SPECIFIC METHODS             #
#   For compatibility with e-puck legacy code   #
#################################################
    @staticmethod
    def reset_robot():
        """EPuck compatibility: Reset robot to safe state."""
        raise NotImplementedError("Static reset_robot method not implemented - use instance methods instead")
