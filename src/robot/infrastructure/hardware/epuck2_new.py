"""EPuck2 robot interface via I2C communication. Based on documentation at: https://www.gctronic.com/doc/index.php?title=Pi-puck#Communicate_with_the_e-puck_version_2"""

import logging
from smbus2 import SMBus, i2c_msg
from VL53L0X import VL53L0X, Vl53l0xAccuracyMode
import time
from typing import List, Tuple, Optional, Any

from application.interfaces.hardware.epuck import EPuckInterface

# Common e-puck2 I2C address
I2C_CHANNEL                     = 12
LEGACY_I2C_CHANNEL              = 4

# IMU Registers using I2C channel and legacy I2C channel
IMU_ADDRESS_1                   = 0x68 # MPU9250 AD1 0
IMU_ADDRESS_2                   = 0x69 # MPU9250 AD1 1
ACCELEROMETER_REGISTRY          = 0x3B
GYROSCOPE_REGISTRY              = 0x43
GRAVITY_CORRECTOR               = 16384 # 1g = 16384 LSB for MPU9250
ACCELEROMETER_DATA_SIZE         = 6
GYROSCOPE_DATA_SIZE             = 6

# EPuck2 Registers using I2C channel and legacy I2C channel
ROBOT_REGISTRY_ADDRESS          = 0x1f

## byte positions in the actuator command packet
LEFT_MOTOR_LOW_BYTE             = 0
LEFT_MOTOR_HIGH_BYTE            = 1
RIGHT_MOTOR_LOW_BYTE            = 2
RIGHT_MOTOR_HIGH_BYTE           = 3
SPEAKER_BYTE                    = 4
FRONT_LED_BYTE                  = 5
LED2_RED_BYTE                   = 6
LED2_GREEN_BYTE                 = 7
LED2_BLUE_BYTE                  = 8
LED4_RED_BYTE                   = 9
LED4_GREEN_BYTE                 = 10
LED4_BLUE_BYTE                  = 11
LED6_RED_BYTE                   = 12
LED6_GREEN_BYTE                 = 13
LED6_BLUE_BYTE                  = 14
LED8_RED_BYTE                   = 15
LED8_GREEN_BYTE                 = 16
LED8_BLUE_BYTE                  = 17
SETTINGS_BYTE                   = 18
CHECKSUM_BYTE                   = 19

LEFT_SPEED_DATA_TOTAL_SIZE      = 2
RIGHT_SPEED_DATA_TOTAL_SIZE     = 2
SPEAKER_DATA_TOTAL_SIZE         = 1
FRONT_LED_DATA_TOTAL_SIZE       = 1
LED2_DATA_TOTAL_SIZE            = 3
LED4_DATA_TOTAL_SIZE            = 3
LED6_DATA_TOTAL_SIZE            = 3
LED8_DATA_TOTAL_SIZE            = 3
SETTINGS_DATA_TOTAL_SIZE        = 1
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
GROUND_SENSOR_REGISTRY          = 0
GROUND_DATA_SIZE                = 6
GROUND_VALUES_SIZE              = 3

# Magnetometer Registers using BOARD I2C channel and legacy I2C channel
BOARD_I2C_CHANNEL               = 11
LEGACY_BOARD_I2C_CHANNEL        = 3
MAGNETOMETER_ADDRESS            = 0x10 # BMM150
MAGNETOMETER_REGISTRY_0         = 0x10
MAGNETOMETER_REGISTRY_1         = 0x11
MAGNETOMETER_REGISTRY_2         = 0x12
MAGNETOMETER_REGISTRY_3         = 0x13


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
        self._i2c_channels = [I2C_CHANNEL, LEGACY_I2C_CHANNEL] if i2c_bus is None else [i2c_bus]
        self._address = i2c_address if i2c_address is not None else ROBOT_REGISTRY_ADDRESS
        self._bus = None
        self._tof = None
        self._initialized = False
        self._reset_actuators_and_sensors()

    def __del__(self):
        """ Destructor to ensure the I2C bus is closed properly."""
        self.close()

    def initialize(self) -> None:
        """ Initialize the I2C bus and verify communication with the robot."""
        if self._initialized:
            return

        for channel in self._i2c_channels:
            try:
                self._bus = channel if isinstance(channel, SMBus) else SMBus(channel)
                self._actuators_data = bytearray([0] * ACTUATORS_SIZE)
                self._sensors_data = bytearray([0] * SENSORS_SIZE)
                self._update_sensors_and_actuators()
                self._initialized = True
                self.logger.info(f"Connected to e-puck2 at address {hex(self._address)} on I2C channel {channel}.")
                break
            except Exception as e:
                self.logger.error(f"Failed to connect on I2C channel {channel}: {e}")
                self._bus = None

        try:
            self._tof = VL53L0X(i2c_bus=I2C_CHANNEL, i2c_address=TOF_ADDRESS)
            self.logger.info(f"Connected to ToF at address {hex(TOF_ADDRESS)} on I2C channel {I2C_CHANNEL}")
        except e:
            self.logger.warning(f"Failed to connect to ToF sensor {I2C_CHANNEL}: {e}")
            self.logger.info(f"Trying to connect on another channel...")
            try:
                self._tof = VL53L0X(i2c_bus=LEGACY_I2C_CHANNEL, i2c_address=TOF_ADDRESS)
                self.logger.info(f"Connected to ToF at address {hex(TOF_ADDRESS)} on I2C channel {LEGACY_I2C_CHANNEL}")
            except:
                self.logger.warning(f"Failed to connect to ToF sensor ({LEGACY_I2C_CHANNEL})")

        if not self._initialized:
            raise ConnectionError("Could not connect to e-puck2 on any I2C channel.")

    def close(self) -> None:
        """ Close the I2C bus if it was opened by this instance."""
        if self._bus is not None:
            try:
                self.logger.info("🧹 EPuck2 cleanup: turning off all hardware")
                self._reset_actuators_and_sensors()
                self._update_sensors_and_actuators()
                self.logger.info("✅ EPuck2 cleanup packet sent successfully")
            except Exception as cleanup_error:
                self.logger.warning(f"⚠️ EPuck2 cleanup failed: {cleanup_error}")
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
        """Send the actuator command packet to the robot and read back the sensor data."""
        if not self._initialized or self._bus is None:
            raise RuntimeError("EPuck2 is not initialized. Call initialize() before sending packets.")

        self._actuators_data[ACTUATORS_SIZE-1] = self._calculate_checksum(self._actuators_data)

        write = i2c_msg.write(self._address, self._actuators_data)
        hex_data = ' '.join([f'{b:02x}' for b in self._actuators_data])
        self.logger.info(f"📝 Sending actuator data ({len(self._actuators_data)}): {hex_data}")

        read = i2c_msg.read(self._address, SENSORS_SIZE)
        self.logger.debug("⌛ Waiting for sensor data...")

        try:
            self._bus.i2c_rdwr(write, read)
            self._sensors_data = list(read)
            self.logger.debug(f"📡 e-puck2 I2C write/read: actuators sent, sensors received ({len(self._sensors_data)} bytes)")
        except Exception as e:
            raise ConnectionError(f"❌ Failed to communicate with e-puck2: {e}")

    def _reset_actuators_and_sensors(self) -> None:
        self._actuators_data = bytearray([0] * ACTUATORS_SIZE)                  # Actuator command buffer
        self._sensors_data = bytearray([0] * SENSORS_SIZE)                      # Sensor data buffer

    def _read_sensors(self) -> Tuple[list[int], list[int], list[int], int, int, list[int], int]:
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

    def _read_tof(self):
        if self._tof is not None:
            distance_in_millimeters = [0 for x in range(1, 101)]
            self._tof.start_ranging(Vl53l0xAccuracyMode.BETTER)
            timing = self._tof.get_timing()
            if timing < 20000:
                timing = 20000

            for i in range (1, 101):
                caught_distance = self._tof.get_distance()
                distance_in_millimeters[i] = caught_distance if caught_distance > 0 else 0
                time.sleep(timing/1000000.00)
            self._tof.stop_ranging()

#################################################
#           EPUCK2 SPECIFIC METHODS             #
#################################################

# Actuators
## Motors
    def go_forward(self, speed: int) -> None:
        """Set both motors to move forward at the specified speed."""
        pass

    def go_backward(self, speed: int) -> None:
        """Set both motors to move backward at the specified speed."""
        pass

    def turn_left(self, speed: int) -> None:
        """Set motors to turn left at the specified speed."""
        pass

    def turn_right(self, speed: int) -> None:
        """Set motors to turn right at the specified speed."""
        pass

    def set_motor_control_mode(self, position_mode: bool) -> None:
        """Set motor control mode: True for position mode, False for speed mode."""
        pass

    def toggle_obstacle_avoidance(self) -> None:
        """Toggle the obstacle avoidance feature."""
        raise NotImplementedError("Obstacle avoidance toggle not implemented yet.")

## LEDs
    def enable_front_leds(self) -> None:
        """Enable the front LEDs."""
        pass

    def disable_front_leds(self) -> None:
        """Disable the front LEDs."""
        pass

    def enable_body_leds(self) -> None:
        """Enable the body LEDs."""
        pass

    def disable_body_leds(self) -> None:
        """Disable the body LEDs."""
        pass

    def set_body_led_rgb(self, red: int, green: int, blue: int, led: int = None) -> None:
        """Set the RGB color of the body LED. If led is None, set all body LEDs."""
        pass

## Sound
    def play_sound(self, sound_id: int) -> None:
        """Play a predefined sound on the e-puck2."""
        pass

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
    def enable_sensors_stream(self) -> None:
        """Enable continuous sensor data streaming."""
        pass

    def disable_sensors_stream(self) -> None:
        """Disable continuous sensor data streaming."""
        pass

## Proximity and Ambient Light
    def calibrate_ir_sensors(self) -> None:
        """Calibrate the IR sensors."""
        pass

    def read_proximity_sensors(self) -> List[float]:
        """Read and return the proximity sensor values."""
        pass

    def read_ambient_light_sensors(self) -> List[float]:
        """Read and return the ambient light sensor values."""
        pass

## Camera
    def enable_image_stream(self) -> None:
        """Enable continuous image streaming."""
        pass

    def disable_image_stream(self) -> None:
        """Disable continuous image streaming."""
        pass

## Microphone
### not implemented yet

## IMU
    def get_accelerometer(self) -> Tuple[float, float, float]:
        """Get accelerometer readings (x, y, z)."""
        pass

    @property
    def accelerometer(self) -> Tuple[float, float, float]:
        """Get accelerometer readings (x, y, z)."""
        return self.get_accelerometer()

    def get_gyroscope(self) -> Tuple[float, float, float]:
        """Get gyroscope readings (x, y, z)."""
        pass

    @property
    def gyroscope(self) -> Tuple[float, float, float]:
        """Get gyroscope readings (x, y, z)."""
        return self.get_gyroscope()

    def get_magnetometer(self) -> Tuple[float, float, float]:
        """Get magnetometer readings (x, y, z)."""
        pass

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
        pass

    def set_right_motor_speed(self, speed):
        pass

    def set_motor_speeds(self, speed_left, speed_right):
        pass

    @property
    def left_motor_speed(self):
        pass

    @property
    def right_motor_speed(self):
        pass

    @property
    def motor_speeds(self):
        pass

    @property
    def left_motor_steps(self):
        pass

    @property
    def right_motor_steps(self):
        pass

    @property
    def motor_steps(self):
        pass

## LEDs
    def set_outer_leds_byte(self, leds):
        pass

    def set_outer_leds(self, led0, led1, led2, led3, led4, led5, led6, led7):
        pass

    def set_inner_leds(self, front, body):
        pass

# Sensors
## Miscellaneous
    def enable_ir_sensors(self, enabled):
        pass

    def get_ir_reflected(self, sensor):
        pass

    @property
    def ir_reflected(self):
        pass

    def get_ir_ambient(self, sensor):
        pass

    @property
    def ir_ambient(self):
        pass

#################################################
#            EPUCK SPECIFIC METHODS             #
#   For compatibility with e-puck legacy code   #
#################################################
    @staticmethod
    def reset_robot():
        pass
