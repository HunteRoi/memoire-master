# WebSocket Protocol Documentation

This document describes the WebSocket communication protocol used between the PuckLab client application and the E-Puck2 robot server.

## Connection Details

- **Endpoint**: `ws://[robot-ip]:8765/robot`
- **Protocol**: WebSocket with JSON message format
- **Authentication**: Path-based validation (`/robot` endpoint only)
- **Heartbeat**: Ping/Pong every 20 seconds with 10-second timeout

## Message Format

All messages follow a consistent JSON structure with automatic timestamp generation.

### Incoming Messages (Client → Robot)

Messages sent from the client to the robot server follow this structure:
- **type**: Message type identifier (see [Message Types](#message-types))
- **data**: Message payload (object containing type-specific data)
- **timestamp**: Message timestamp (automatically added if not present)

### Outgoing Messages (Robot → Client)

Messages sent from the robot to the client follow this structure:
- **type**: Response type identifier
- **data**: Response payload (optional, depends on message type)
- **message**: Human-readable message (optional, mainly for errors)
- **timestamp**: Response timestamp (automatically generated)

## Message Types

### COMMAND Messages

Used to execute Python commands on the robot.

#### Client Request
- **type**: `"command"`
- **data**: Object containing:
  - **command**: String containing Python code to execute

#### Robot Response
**Success Response:**
- **type**: `"success"`
- **data**: Object containing:
  - **result**: String representation of command result
  - **command**: Truncated command string (max 100 characters)

**Error Response:**
- **type**: `"error"`
- **message**: String describing the error that occurred

### PING/PONG Messages

Used for connection health monitoring and keepalive.

#### Client Request
- **type**: `"ping"`
- **data**: Object (can contain any data for echo testing)

#### Robot Response
- **type**: `"pong"`
- **data**: Object containing:
  - **timestamp**: Original ping timestamp for latency calculation

### STATUS Messages

Used for robot status queries and client disconnection signaling.

#### Client Status Request
- **type**: `"status"`
- **data**: Object (empty for status request)

#### Client Disconnection Signal
- **type**: `"status"`
- **data**: Object containing:
  - **status**: `"disconnecting"` (signals graceful disconnect)

#### Robot Status Response
- **type**: `"status"`
- **data**: Object containing comprehensive robot status:
  - **robot_id**: Robot identifier (typically "e-puck2")
  - **state**: Current operational state (idle/connected/running/paused/error)
  - **firmware_version**: Robot firmware version
  - **sensors**: Object containing current sensor readings:
    - **proximity**: Array of 8 proximity sensor values
    - **light**: Array of 8 light sensor values
    - **accelerometer**: Array of [x, y, z] acceleration values
    - **gyroscope**: Array of [x, y, z] rotation values
    - **microphone**: Current microphone level
  - **timestamp**: Sensor reading timestamp

### ERROR Messages

Error messages can be sent at any time in response to invalid requests or system errors.

#### Robot Error Response
- **type**: `"error"`
- **message**: Descriptive error message

## Connection Lifecycle

### 1. Connection Establishment
1. Client connects to `ws://[robot-ip]:8765/robot`
2. Server validates the path (must be `/robot`)
3. Server adds client to active connections
4. Server sends initial STATUS message with current robot state
5. If first client, robot state changes to CONNECTED

### 2. Active Communication
- Client can send COMMAND, PING, or STATUS messages
- Robot responds appropriately to each message type
- Background health monitoring with periodic status updates
- Robot state changes based on activity (RUNNING during command execution)

### 3. Disconnection
- Client can signal graceful disconnect with STATUS message
- Server handles connection drops automatically
- If last client disconnects, robot state changes to IDLE
- Server cleans up client resources

## State Management

The robot maintains several operational states that affect behavior:

### IDLE
- No active client connections
- LED indicator: Blue pulsing
- Audio: Low A note (440 Hz)

### CONNECTED  
- At least one active client connection
- LED indicator: Green solid
- Audio: C# note (554 Hz)

### RUNNING
- Actively executing a command
- LED indicator: Yellow blinking
- Audio: E note (659 Hz)

### PAUSED
- Command execution paused
- LED indicator: Orange pulsing
- No audio feedback

### ERROR
- System error or hardware failure
- LED indicator: Red fast blinking
- Audio: Error sound sequence

## Error Handling

### Connection Errors
- **4004**: Invalid WebSocket path (not `/robot`)
- **1000**: Normal closure (client requested disconnect)
- **Automatic**: Network disconnection or timeout

### Message Errors
- **Invalid JSON**: Returns error message about JSON parsing
- **Unknown Message Type**: Returns error about unsupported message type
- **Command Execution**: Returns error with Python exception details

### Hardware Errors
- Hardware component failures are reported as ERROR status
- Robot automatically transitions to ERROR state
- Client receives status update with error information

## Security Considerations

### Command Execution Safety
- Commands execute in a sandboxed environment
- Only whitelisted Python functions and modules are available
- Direct hardware access is provided through controlled interfaces
- Execution timeouts prevent infinite loops

### Connection Security
- Path validation prevents unauthorized access
- Message validation prevents malformed requests
- Resource limits prevent DoS attacks
- Automatic cleanup prevents resource exhaustion

## Example Message Flows

### Basic Command Execution
1. **Client** → **Robot**: `{"type": "command", "data": {"command": "motors.set_speed(50, 50)"}}`
2. **Robot** → **Client**: `{"type": "success", "data": {"result": "None", "command": "motors.set_speed(50, 50)"}, "timestamp": 1634567890.123}`

### Health Check
1. **Client** → **Robot**: `{"type": "ping", "data": {}}`
2. **Robot** → **Client**: `{"type": "pong", "data": {"timestamp": 1634567890.123}, "timestamp": 1634567890.125}`

### Status Query
1. **Client** → **Robot**: `{"type": "status", "data": {}}`
2. **Robot** → **Client**: `{"type": "status", "data": {"robot_id": "e-puck2", "state": "connected", ...}, "timestamp": 1634567890.123}`

### Error Handling
1. **Client** → **Robot**: `{"type": "command", "data": {"command": "invalid_function()"}}`
2. **Robot** → **Client**: `{"type": "error", "message": "Command failed: name 'invalid_function' is not defined", "timestamp": 1634567890.123}`

This protocol provides reliable, real-time communication between the client application and robot hardware while maintaining security and performance.