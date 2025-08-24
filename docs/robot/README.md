# Robot Server Documentation

The PuckLab robot server is a Python-based WebSocket server designed to control E-Puck2 robots. It provides a clean interface for motor control, sensor reading, LED management, and audio feedback.

## 🏗️ Architecture

The robot server follows **Clean Architecture** principles with clear separation of concerns:

```
src/robot/
├── domain/              # Business logic and entities
│   ├── entities.py      # Core business entities (Robot state, commands, sensors)
│   └── interfaces.py    # Abstract interfaces for hardware components
├── application/         # Use cases and application services
│   ├── services.py      # Main robot service and WebSocket service
│   └── use_cases.py     # Command execution, state management, health monitoring
├── infrastructure/      # External adapters and hardware implementations
│   ├── epuck2_audio.py  # Audio hardware implementation
│   ├── epuck2_leds.py   # LED control implementation
│   ├── epuck2_motor.py  # Motor control implementation
│   └── epuck2_sensors.py # Sensor reading implementation
├── config/             # Configuration modules
│   ├── logging.py      # Logging configuration
│   └── network.py      # Network configuration
└── main.py             # Application entry point
```

## 🎯 Key Components

### Domain Layer

The domain layer contains the core business entities and interfaces that define the robot's capabilities.

#### Entities
Located in [`domain/entities.py`](../../src/robot/domain/entities.py):
- **RobotState**: Enum defining operational states (IDLE, CONNECTED, RUNNING, PAUSED, ERROR)
- **MessageType**: WebSocket message types for communication protocol
- **RobotMessage**: Incoming messages from client applications
- **RobotResponse**: Outgoing responses with automatic timestamp generation
- **SensorReading**: Structured sensor data with proximity, light, accelerometer, and gyroscope readings
- **Command Objects**: Motor, LED, and Audio commands with validation

#### Interfaces
Located in [`domain/interfaces.py`](../../src/robot/domain/interfaces.py):
- **HardwareInterface**: Base interface for all hardware components with initialization and cleanup
- **MotorInterface**: Abstract motor control with speed setting and command execution
- **SensorInterface**: Abstract sensor reading for all E-Puck2 sensors
- **LEDInterface**: Abstract LED control for body and front LEDs
- **AudioInterface**: Abstract audio playback for tones and sound effects
- **StateManagerInterface**: Robot state management with transition validation
- **CommandExecutorInterface**: Safe Python command execution interface

### Application Layer

#### Robot Service
The main application service in [`application/services.py`](../../src/robot/application/services.py) orchestrates all robot operations:
- **Hardware Coordination**: Manages all hardware components through dependency injection
- **Command Processing**: Executes Python commands safely in a controlled environment
- **Status Reporting**: Provides comprehensive robot status including sensor data
- **State Management**: Coordinates state changes with visual and audio feedback

#### WebSocket Service
Handles client connections and message processing:
- **Connection Management**: Tracks multiple client connections with automatic cleanup
- **Message Routing**: Routes different message types to appropriate handlers
- **Real-time Communication**: Ping/pong heartbeat and status broadcasting
- **Error Handling**: Comprehensive error reporting with graceful degradation

### Use Cases

#### Command Executor
Located in [`application/use_cases.py`](../../src/robot/application/use_cases.py), provides safe Python code execution:
- **Sandbox Environment**: Controlled execution environment with whitelisted functions and modules
- **Async Support**: Handles both synchronous and asynchronous Python code
- **Hardware Access**: Provides direct access to robot hardware through safe interfaces
- **Error Isolation**: Prevents malicious or erroneous code from crashing the system

#### State Manager
Implements sophisticated state management:
- **State Transitions**: Validates state changes according to business rules
- **Visual Feedback**: Updates LED colors and patterns based on current state
- **Audio Feedback**: Plays distinctive sounds for different state transitions
- **Error Recovery**: Automatic error state handling with recovery mechanisms

#### Health Monitor
Continuous system health monitoring:
- **Sensor Validation**: Periodic sensor health checks
- **Connection Monitoring**: Tracks client connections and system responsiveness
- **Automatic Recovery**: Switches to error state when issues are detected
- **Background Operation**: Runs independently without blocking main operations

### Infrastructure Layer

#### Hardware Implementations
Each hardware component has a dedicated implementation:

- **EPuck2Motor** ([`infrastructure/epuck2_motor.py`](../../src/robot/infrastructure/epuck2_motor.py)): Motor control using the pi-puck library with speed clamping and safety features
- **EPuck2Sensors** ([`infrastructure/epuck2_sensors.py`](../../src/robot/infrastructure/epuck2_sensors.py)): Comprehensive sensor reading with error handling
- **EPuck2LEDs** ([`infrastructure/epuck2_leds.py`](../../src/robot/infrastructure/epuck2_leds.py)): LED control with pattern support and color management
- **EPuck2Audio** ([`infrastructure/epuck2_audio.py`](../../src/robot/infrastructure/epuck2_audio.py)): Audio playback with frequency control and sound effects

## 🌐 WebSocket Protocol

The robot server implements a comprehensive WebSocket protocol for real-time communication. Full protocol documentation is available in [`websocket-protocol.md`](./websocket-protocol.md).

### Message Types
- **COMMAND**: Execute Python code on the robot
- **PING/PONG**: Connection health monitoring
- **STATUS**: Robot status requests and updates
- **SUCCESS/ERROR**: Operation results and error reporting

### Connection Flow
1. **Client Connection**: WebSocket connection to `/robot` endpoint
2. **Authentication**: Path validation and client registration
3. **Status Update**: Initial robot status broadcast
4. **Message Loop**: Continuous message processing
5. **Cleanup**: Automatic resource cleanup on disconnection

## 🔒 Security Features

### Safe Code Execution
The command executor implements multiple security layers:
- **Whitelist Approach**: Only approved functions and modules are available
- **Execution Isolation**: Commands run in a controlled environment
- **Resource Limits**: Prevents infinite loops and resource exhaustion
- **Hardware Protection**: Direct hardware access through controlled interfaces only

### Input Validation
- **Message Validation**: All WebSocket messages are validated before processing
- **Type Safety**: Strict type checking for all input parameters
- **Error Boundaries**: Malformed requests are isolated and reported safely

### Connection Security
- **Path Validation**: Only authorized WebSocket paths are accepted
- **Client Tracking**: All connections are monitored and can be terminated
- **Resource Management**: Automatic cleanup prevents resource leaks

## 🚀 Performance Features

### Asynchronous Architecture
The entire server is built on Python's asyncio framework:
- **Non-blocking Operations**: All I/O operations are asynchronous
- **Concurrent Connections**: Multiple clients can connect simultaneously
- **Hardware Abstraction**: Hardware operations are wrapped in async interfaces
- **Efficient Resource Usage**: Minimal thread overhead with event-loop based processing

### Hardware Optimization
- **Sensor Batching**: Multiple sensor readings are batched for efficiency
- **Command Queuing**: Hardware commands are queued to prevent conflicts
- **State Caching**: Current state is cached to avoid unnecessary hardware calls
- **Error Recovery**: Hardware errors are handled gracefully without system failure

## 🔧 Configuration

### Network Configuration
Network settings are managed in [`config/network.py`](../../src/robot/config/network.py):
- **Host Detection**: Automatic network interface detection
- **Port Configuration**: Configurable WebSocket port (default 8765)
- **Connection Limits**: Configurable client connection limits

### Logging Configuration
Comprehensive logging system in [`config/logging.py`](../../src/robot/config/logging.py):
- **Structured Logging**: JSON-formatted logs for analysis
- **Multiple Handlers**: Console and file logging with rotation
- **Level Configuration**: Environment-based log level control
- **Performance Monitoring**: Request timing and resource usage logging

## 🔄 Lifecycle Management

### Startup Sequence
The server startup process in [`main.py`](../../src/robot/main.py) includes:
1. **Configuration Loading**: Network and logging configuration
2. **Hardware Initialization**: All hardware components are initialized and tested
3. **Service Creation**: Application services are created with dependency injection
4. **Server Start**: WebSocket server starts accepting connections
5. **Health Monitoring**: Background health monitoring begins

### Graceful Shutdown
The shutdown process ensures clean resource cleanup:
1. **Signal Handling**: SIGTERM and SIGINT are handled gracefully
2. **Connection Closure**: All client connections are closed properly
3. **Hardware Cleanup**: All hardware components are cleaned up
4. **Resource Deallocation**: Memory and file handles are released

### Error Recovery
The system implements multiple levels of error recovery:
- **Component Level**: Individual hardware components can recover from errors
- **Service Level**: Services can restart failed components
- **System Level**: The entire system can restart if critical errors occur

## 📊 Monitoring and Observability

### Health Metrics
The system provides comprehensive health metrics:
- **Hardware Status**: Individual component health and responsiveness
- **Connection Metrics**: Number of active connections and message throughput
- **Performance Metrics**: Command execution times and resource usage
- **Error Rates**: Tracking of different error types and frequencies

### Debugging Support
- **Detailed Logging**: Comprehensive logging with context information
- **State Inspection**: Current system state is always available
- **Error Tracing**: Full stack traces for debugging
- **Performance Profiling**: Built-in performance monitoring tools

This documentation provides a complete overview of the PuckLab robot server architecture and implementation.
