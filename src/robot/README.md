# E-puck2 Robot WebSocket Server

A Clean Architecture implementation of a WebSocket server for controlling e-puck2 robots, built with Python 3.7 and following proper dependency inversion principles.

## Architecture

The codebase follows Clean Architecture with proper separation of concerns and dependency inversion:

```
src/robot/
├── domain/                     # Pure business entities (no dependencies)
│   └── entities.py             # Core entities (RobotState, Commands, SensorReading, etc.)
├── application/                # Application layer (business logic)
│   ├── interfaces/             # Ports (contracts for dependency inversion)
│   │   ├── hardware/           # Hardware interface contracts
│   │   │   ├── motor_interface.py
│   │   │   ├── sensor_interface.py
│   │   │   ├── led_interface.py
│   │   │   └── audio_interface.py
│   │   ├── message_handler.py  # Message handling contract
│   │   └── notification_service.py # Client notification contract
│   ├── use_cases/              # Business logic (receive interfaces via DI)
│   │   ├── motor_use_cases.py
│   │   ├── sensor_use_cases.py
│   │   ├── led_use_cases.py
│   │   └── audio_use_cases.py
│   ├── command_router.py       # Routes commands to use cases
│   ├── robot_controller.py     # Main application orchestrator
│   └── status_handler.py       # Robot status feedback logic
├── infrastructure/             # External adapters (implement application interfaces)
│   ├── hardware/               # GPIO/I2C hardware implementations
│   │   ├── motors.py           # Implements MotorInterface
│   │   ├── sensors.py          # Implements SensorInterface
│   │   ├── leds.py             # Implements LEDInterface
│   │   └── audio.py            # Implements AudioInterface
│   └── websocket/              # WebSocket infrastructure
│       └── websocket_server.py # Implements NotificationServiceInterface
└── main.py                     # Dependency injection and server startup
```

### Clean Architecture Principles Applied

- **Dependency Inversion**: Infrastructure depends on Application, not vice versa
- **Interface Segregation**: Separate interfaces for each hardware component
- **Single Responsibility**: Each use case handles one specific business concern
- **Dependency Injection**: Hardware interfaces injected into use cases at runtime

## Features

- **Clean Architecture**: Proper separation of concerns with dependency inversion
- **WebSocket Communication**: Real-time communication with GUI clients
- **Hardware Abstraction**: Clean interfaces for motor, sensor, LED, and audio control
- **Direct GPIO Control**: No external dependencies, direct Pi GPIO control
- **Optimized Installation**: Uses piwheels for fast Raspberry Pi package installation
- **Command Routing**: Structured command routing to appropriate use cases
- **Status Feedback**: Visual and audio feedback for robot operations
- **Async Architecture**: Full async/await support throughout

## Installation

### Complete Setup (First Time)
```bash
make setup
```
This runs: install system deps → install Python 3.7 → create venv → install requirements

### Quick Commands
```bash
make venv      # Create virtual environment and install requirements (fast with piwheels)
make run       # Start the robot server
make clean     # Clean everything
make help      # Show all available commands
```

### Manual Installation

1. **Install System Dependencies**:
```bash
make install   # Installs pyenv, pigpio, GPIO tools, audio utilities, etc.
```

2. **Install Python 3.7**:
```bash
make install-python   # Uses pyenv to install Python 3.7.17
```

3. **Create Virtual Environment**:
```bash
make venv     # Uses piwheels for fast installation (no compilation!)
```

4. **Create Configuration**:
```bash
make config   # Creates .env from .env.example
```

## Usage

### Start the Server
```bash
make run     # Automatically starts pigpio daemon if needed
# OR
python main.py
```

**Note**: The robot requires the pigpio daemon for GPIO control. If you get pigpio connection errors:
```bash
sudo pigpiod          # Start the daemon manually
make status-pigpio    # Check if daemon is running
make stop-pigpio      # Stop the daemon if needed
```

Server starts on `ws://0.0.0.0:8765/robot`

### Environment Configuration

Create a `.env` file (copied from `.env.example`):
```bash
# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/robot_server.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=5

# WebSocket Server Configuration
ROBOT_HOST=0.0.0.0
ROBOT_PORT=8765
```

## WebSocket Protocol

### Command Message Format

All messages are JSON with this structure:

```json
{
  "type": "command",
  "data": {
    "command": "move_forward",
    "speed": 50,
    "duration": 2.0
  }
}
```

### Available Commands

#### Motor Commands
```json
{"command": "move_forward", "speed": 50, "duration": 2.0}
{"command": "move_backward", "speed": 50, "duration": 2.0}
{"command": "turn_left", "angle": 90, "speed": 50}
{"command": "turn_right", "angle": 90, "speed": 50}
{"command": "stop_motors"}
{"command": "set_motor_speeds", "left_speed": 30, "right_speed": -30}
```

#### LED Commands
```json
{"command": "set_led_color", "color": "red"}
{"command": "set_led_rgb", "red": 255, "green": 0, "blue": 0}
{"command": "blink_led", "red": 0, "green": 0, "blue": 255, "count": 3, "speed": 0.5}
{"command": "led_off"}
{"command": "set_front_led", "enabled": true}
```

#### Audio Commands
```json
{"command": "play_beep", "duration": 0.3}
{"command": "stop_audio"}
```

#### Sensor Commands
```json
{"command": "read_sensors"}
{"command": "read_proximity"}
{"command": "read_light"}
{"command": "read_imu"}
{"command": "read_battery"}
{"command": "detect_ground_color", "threshold": 1000}
```

### Server Responses

**Success Response:**
```json
{
  "type": "success",
  "data": {
    "success": true,
    "action": "move_forward",
    "speed": 50,
    "duration": 2.0
  }
}
```

**Error Response:**
```json
{
  "type": "error",
  "data": {
    "success": false,
    "error": "Motor not initialized"
  }
}
```

## Hardware Implementation

### Direct GPIO Control
- **Motors**: Direct PWM control via Pi GPIO pins
- **LEDs**: I2C communication with Pi-puck LED controller + GPIO front LED
- **Audio**: pigpio PWM buzzer + system audio commands (aplay/mplayer) for file playback
- **Sensors**: I2C communication for proximity, light, accelerometer, gyroscope

### Raspberry Pi Compatibility
- **Optimized for Pi Zero W** with Python 3.7
- **Fast installation** using piwheels (no compilation)
- **Minimal dependencies** for reliable hardware control

## Development

### Architecture Guidelines

When adding new features:

1. **Domain**: Add new entities to `domain/entities.py`
2. **Application**:
   - Create interfaces in `application/interfaces/hardware/`
   - Implement business logic in `application/use_cases/`
3. **Infrastructure**:
   - Implement hardware interfaces in `infrastructure/hardware/`
   - Use dependency injection in `main.py`

### Code Quality

```bash
# Install development tools
pip install black flake8 mypy

# Format code
black src/

# Check style
flake8 src/

# Type checking
mypy src/
```

## Troubleshooting

### Common Issues

1. **Import errors**: Run `make venv` to reinstall dependencies
2. **Permission denied**: Ensure user is in `gpio` and `i2c` groups
3. **Slow installation**: Use `make venv` which uses piwheels (no compilation)
4. **Hardware not responding**: Check GPIO/I2C connections and permissions

### Debug Logging

Enable debug logging in `.env`:
```bash
LOG_LEVEL=DEBUG
```

Or run with debug:
```bash
LOG_LEVEL=DEBUG make run
```

### Clean Installation

If you encounter issues:
```bash
make clean      # Remove everything
make setup      # Complete fresh setup
```

## License

This project is part of the PuckLab educational robotics platform.
