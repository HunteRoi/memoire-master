# E-puck2 Robot WebSocket Server

A clean architecture implementation of a WebSocket server for controlling e-puck2 robots, built with Python 2.7 for Pi Zero W compatibility and following clean architecture principles.

## Architecture

The codebase follows clean architecture with clear separation of concerns:

```
src/robot/
├── domain/           # Business logic and entities
│   ├── entities.py   # Core entities (RobotState, commands, etc.)
│   └── interfaces.py # Abstract interfaces
├── application/      # Use cases and application services
│   ├── use_cases.py  # Command execution, state management, health monitoring
│   └── services.py   # Robot service and WebSocket service
├── infrastructure/   # External dependencies and hardware implementations
│   ├── epuck2_motor.py
│   ├── epuck2_sensors.py
│   ├── epuck2_leds.py
│   └── epuck2_audio.py
├── config/           # Configuration and logging
│   └── logging.py
├── main.py           # Main server orchestrator
└── start_server.py   # Startup script
```

## Features

- **WebSocket Communication**: Real-time communication with e-puck2 robots
- **Hardware Abstraction**: Clean interfaces for motor, sensor, LED, and audio control
- **State Management**: Robust robot state transitions with visual/audio feedback
- **Command Execution**: Safe Python command execution with sandboxed environment
- **Health Monitoring**: Continuous sensor monitoring with automatic error detection
- **Logging**: Comprehensive logging with rotation and configurable levels
- **Graceful Shutdown**: Proper cleanup of hardware resources

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure your e-puck2 robot has the required packages:
- `unifr-api-epuck` - Official e-puck2 API
- `pi-puck` - Python interface for e-puck2

## Usage

### Basic Usage

```bash
python start_server.py
```

This starts the WebSocket server on `ws://0.0.0.0:8765/robot`

### Advanced Usage

```bash
# Custom host and port
python start_server.py --host 192.168.0.100 --port 9000

# Debug logging
python start_server.py --log-level DEBUG

# Using environment variables
LOG_LEVEL=DEBUG ROBOT_PORT=9000 python start_server.py
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL) |
| `LOG_FILE` | `logs/robot_server.log` | Log file path |
| `LOG_MAX_BYTES` | `10485760` | Maximum log file size (10MB) |
| `LOG_BACKUP_COUNT` | `5` | Number of backup log files |
| `ROBOT_HOST` | `0.0.0.0` | Server host address |
| `ROBOT_PORT` | `8765` | Server port |

## WebSocket Protocol

### Message Format

All messages are JSON with the following structure:

```json
{
  "type": "command|ping|status|success|error|pong",
  "data": { ... },
  "timestamp": 1234567890.123
}
```

### Message Types

#### Client → Server

**Command Execution:**
```json
{
  "type": "command",
  "data": {
    "command": "motors.set_speed(50, -50)"
  }
}
```

**Ping:**
```json
{
  "type": "ping",
  "data": {}
}
```

**Status Request:**
```json
{
  "type": "status",
  "data": {
    "status": "disconnecting"
  }
}
```

#### Server → Client

**Success Response:**
```json
{
  "type": "success",
  "data": {
    "result": "Command executed successfully",
    "command": "motors.set_speed(50, -50)"
  },
  "timestamp": 1234567890.123
}
```

**Status Response:**
```json
{
  "type": "status",
  "data": {
    "robot_id": "e-puck2",
    "state": "connected",
    "firmware_version": "1.0.0",
    "sensors": {
      "proximity": [0, 0, 0, 0, 0, 0, 0, 0],
      "light": [0, 0, 0, 0, 0, 0, 0, 0],
      "accelerometer": [0.0, 0.0, 9.8],
      "gyroscope": [0.0, 0.0, 0.0],
      "microphone": 0.0
    },
    "timestamp": 1234567890.123
  }
}
```

**Error Response:**
```json
{
  "type": "error",
  "message": "Command execution failed: Invalid syntax",
  "timestamp": 1234567890.123
}
```

## Available Commands

The server provides a sandboxed Python environment with access to robot hardware:

### Motor Control
```python
# Set motor speeds (-100 to 100)
motors.set_speed(50, -50)

# Stop motors
motors.stop()
```

### LED Control
```python
# Set body LED color and pattern
leds.set_color("red", "blink")
leds.set_color("blue", "pulse")

# Set RGB values directly
leds.set_body_led(255, 0, 0)

# Front LED control
leds.set_front_led(True)
```

### Audio
```python
# Play tones
audio.play_tone(440, 0.5)  # A note for 0.5 seconds

# Simple beep
audio.play_beep()

# Error sound
audio.play_error_sound()
```

### Sensors
```python
# Get sensor readings
proximity = sensors.get_proximity()
light = sensors.get_light()
accel = sensors.get_accelerometer()
gyro = sensors.get_gyroscope()
mic_level = sensors.get_microphone()

# Get all readings at once
all_sensors = sensors.get_all_readings()
```

### Utility Functions
```python
# Sleep/delays
sleep(1.0)  # Sleep for 1 second

# Basic Python functions
len(proximity)
range(8)
print("Hello from e-puck2!")
```

## Robot States

The robot maintains the following states with visual/audio feedback:

- **IDLE**: Blue pulsing LED, A note (440Hz)
- **CONNECTED**: Green solid LED, C# note (554Hz)
- **RUNNING**: Yellow blinking LED, E note (659Hz)
- **PAUSED**: Orange pulsing LED
- **ERROR**: Red fast blinking LED, error sound sequence

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Code Style

The project follows PEP 8 and uses type hints throughout. Use tools like `black`, `flake8`, and `mypy` for code quality:

```bash
pip install black flake8 mypy
black src/
flake8 src/
mypy src/
```

## Troubleshooting

### Common Issues

1. **Permission denied accessing hardware**: Ensure the user has proper permissions to access GPIO/I2C devices
2. **Connection refused**: Check if the robot is connected and the server port is available
3. **Import errors**: Verify all dependencies are installed with `pip install -r requirements.txt`

### Logging

Enable debug logging for detailed troubleshooting:

```bash
LOG_LEVEL=DEBUG python start_server.py
```

Log files are rotated automatically and stored in the `logs/` directory.

## License

This project is part of the PuckLab educational robotics platform.
