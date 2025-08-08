# System Architecture

This document provides a comprehensive overview of PuckLab's system architecture, design patterns, and architectural decisions.

## Overview

PuckLab implements a distributed system with two main components communicating over WebSocket protocol:

1. **Client Application**: Desktop application for programming and control
2. **Robot Server**: Python server running on E-Puck2 robots

The architecture follows **Clean Architecture** principles with strict separation of concerns and dependency inversion.

## High-Level Architecture

```
┌─────────────────────┐         WebSocket/TCP         ┌─────────────────────┐
│    Client App       │◄─────────────────────────────►│   Robot Server      │
│  (Electron/React)   │                               │     (Python)        │
└─────────────────────┘                               └─────────────────────┘
          │                                                       │
          │                                                       │
          ▼                                                       ▼
┌─────────────────────┐                               ┌─────────────────────┐
│  Visual Programming │                               │   E-Puck2 Hardware  │
│  & Python Editor    │                               │   Motor/LED/Sensors │
└─────────────────────┘                               └─────────────────────┘
```

## Client Application Architecture

### Layered Architecture

The client follows a strict layered architecture with clear dependency rules:

```
┌─────────────────────────────────────────────────────────┐
│                 Presentation Layer                      │
│  (React Components, Hooks, Contexts, Pages)             │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Application Layer                        │
│        (Use Cases, Interfaces, Container)               │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                       │
│    (WebSocket, File System, IPC, Hardware)              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Domain Layer                           │
│     (Entities, Value Objects, Business Rules)           │
└─────────────────────────────────────────────────────────┘
```

### Domain Layer

**Purpose**: Contains core business logic and entities, independent of external concerns.

**Key Components**:
- **Robot Entity**: Core business entity with IP address, port, and derived properties
- **RobotBuilder**: Builder pattern with comprehensive validation
- **Result Monad**: Functional error handling eliminating try-catch blocks
- **Error Classes**: Domain-specific error types with contextual information
- **Constants**: Application-wide constants and configuration values

**Dependencies**: None - completely isolated from external frameworks

### Infrastructure Layer

**Purpose**: Handles external systems and provides concrete implementations of domain interfaces.

**Key Components**:
- **WebSocket Communication**: Real-time communication with robot servers
- **File System Repository**: Robot configuration persistence
- **IPC Communication**: Inter-process communication in Electron
- **Logging**: Structured logging with multiple output targets
- **Security**: Input validation and sanitization

**Dependencies**: External libraries, system APIs, hardware interfaces

### Application Layer

**Purpose**: Orchestrates domain and infrastructure components to implement use cases.

**Key Components**:
- **Use Cases**:
  - `ManageRobots`: Robot CRUD operations with business rule enforcement
  - `ManageRobotConnection`: Connection lifecycle management
- **Interfaces**: Abstract definitions for infrastructure components
- **Container**: Dependency injection container with singleton pattern

**Dependencies**: Domain layer interfaces, infrastructure implementations

### Presentation Layer

**Purpose**: User interface and user interaction handling.

**Key Components**:
- **React Components**: Following smart/dumb component pattern
- **Custom Hooks**: Encapsulating UI logic and state management
- **Context API**: Global state management with useReducer
- **Routing**: Application navigation and page management

**Dependencies**: Application layer use cases, React ecosystem

## Robot Server Architecture

### Clean Architecture Implementation

```
┌─────────────────────────────────────────────────────────┐
│                Infrastructure Layer                     │
│     (Hardware Implementations, WebSocket Server)        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Application Layer                        │
│        (Services, Use Cases, Command Handlers)          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Domain Layer                           │
│    (Robot State, Commands, Interfaces, Entities)        │
└─────────────────────────────────────────────────────────┘
```

### Domain Layer

**Purpose**: Defines robot capabilities, states, and business rules.

**Key Components**:
- **Entity Models**: Robot state, sensor readings, command objects
- **Interfaces**: Abstract hardware component interfaces
- **State Management**: Robot operational states with transition rules
- **Command Objects**: Structured commands for motor, LED, audio control

### Application Layer

**Purpose**: Implements robot control use cases and manages system lifecycle.

**Key Components**:
- **Robot Service**: Main orchestrator coordinating all robot operations
- **WebSocket Service**: Handles client connections and message routing
- **Use Cases**:
  - `CommandExecutor`: Safe Python code execution in sandboxed environment
  - `StateManager`: Robot state transitions with feedback
  - `HealthMonitor`: Continuous system health monitoring

### Infrastructure Layer

**Purpose**: Hardware abstractions and external system interfaces.

**Key Components**:
- **Hardware Implementations**: Concrete implementations for each hardware component
- **Network Layer**: WebSocket server and connection management
- **Configuration**: System configuration and environment management

## Design Patterns

### Builder Pattern

**Location**: Client domain layer (`robot.ts`)
**Purpose**: Complex robot object construction with validation

The RobotBuilder implements fluent interface with:
- Method chaining for readable construction
- Comprehensive validation at build time
- Error accumulation for multiple validation failures
- Immutable result with Result monad

### Result/Either Monad

**Location**: Client domain layer (`result.ts`)
**Purpose**: Functional error handling without exceptions

Benefits:
- Explicit error handling in type system
- Composable error handling operations
- Eliminates hidden exceptions
- Force developers to handle error cases

### Repository Pattern

**Location**: Client infrastructure layer
**Purpose**: Data persistence abstraction

Implementation details:
- Abstract interface in application layer
- Concrete file system implementation
- Error handling with Result monad
- Testable with mock implementations

### Strategy Pattern

**Location**: Both client and robot server
**Purpose**: Interchangeable algorithm implementations

Examples:
- **Client**: Different communication services (Mock vs WebSocket)
- **Robot**: Different hardware implementations per component
- **Robot**: Different audio playback strategies

### State Pattern

**Location**: Robot server application layer
**Purpose**: Robot behavioral state management

Implementation:
- Enum-based states with transition validation
- State-specific behavior (LED patterns, audio feedback)
- Centralized state transition logic
- Error state handling and recovery

### Observer Pattern

**Location**: Client presentation layer (React Context)
**Purpose**: State change notification and UI updates

Implementation:
- React Context with useReducer for state management
- Typed actions for all state changes
- Component subscriptions via useContext
- Optimized re-rendering with memoization

### Command Pattern

**Location**: Robot server domain layer
**Purpose**: Encapsulating hardware operations

Benefits:
- Uniform interface for different hardware operations
- Queuing and batching capabilities
- Undo/redo potential for educational features
- Macro recording for complex operations

## Communication Architecture

### WebSocket Protocol

**Protocol**: Custom JSON-based protocol over WebSocket
**Port**: 8765 (configurable)
**Format**: Structured message types with timestamp metadata

**Message Flow**:
```
Client                           Robot Server
  │                                   │
  ├─ COMMAND ────────────────────────►│
  │                                   ├─ Execute Python code
  │                                   ├─ Update robot state
  │◄─────────────────── SUCCESS/ERROR─┤
  │                                   │
  ├─ STATUS ─────────────────────────►│
  │◄───────────────── STATUS_RESPONSE─┤
  │                                   │
  ├─ PING ───────────────────────────►│
  │◄──────────────────────────── PONG─┤
```

### Error Handling Strategy

**Client Side**:
- Result monad for operation results
- Error boundaries for React component errors
- Graceful degradation for network failures
- User-friendly error messages with context

**Robot Side**:
- Exception isolation in command execution
- Hardware error recovery mechanisms
- State-based error handling
- Detailed error reporting with context

## Security Architecture

### Client Security

**Input Validation**:
- Domain-level validation in entity builders
- Component-level validation with immediate feedback
- IPC validation before main process execution

**Secure Communication**:
- WebSocket connection validation
- Message format validation
- Network timeout handling

### Robot Server Security

**Sandbox Execution**:
- Whitelisted Python functions and modules
- Controlled execution environment
- Resource limits and timeouts
- Hardware access through controlled interfaces

**Network Security**:
- WebSocket path validation
- Connection rate limiting
- Message size limits
- Graceful handling of malformed messages

## Performance Architecture

### Client Performance

**React Optimizations**:
- Component memoization with custom comparison
- Hook dependencies optimization
- State update batching
- Code splitting and lazy loading

**Memory Management**:
- Proper cleanup in useEffect hooks
- Event listener cleanup
- WebSocket connection management
- Resource disposal patterns

### Robot Server Performance

**Async Architecture**:
- Non-blocking I/O operations
- Concurrent client handling
- Hardware operation batching
- Efficient resource utilization

**Hardware Optimization**:
- Sensor reading batching
- Command queuing and prioritization
- State caching to avoid redundant hardware calls
- Background health monitoring

## Scalability Considerations

### Horizontal Scaling

**Multi-Robot Support**:
- Client can connect to multiple robots simultaneously
- Each robot runs independent server instance
- Centralized robot discovery and management
- Load balancing for robot selection

**Educational Deployment**:
- Classroom scenarios with many client-robot pairs
- Network bandwidth optimization
- Centralized monitoring and management
- Scalable error reporting and logging

### Vertical Scaling

**Resource Optimization**:
- Efficient memory usage patterns
- CPU optimization for real-time operations
- Network bandwidth conservation
- Storage efficiency for configuration data

## Development Architecture

### Development Strategy

**Component Development**:
- Domain logic development with pure functions
- Component development with React patterns
- Mock implementations for external dependencies
- Async operation development with proper patterns

**Integration Development**:
- WebSocket protocol compliance development
- Hardware integration development with mock hardware
- End-to-end user workflow development
- Performance optimization under realistic loads

**Deployment Verification**:
- Cross-platform compatibility verification
- Hardware compatibility across E-Puck2 variants
- Network condition verification (latency, packet loss)
- Long-running stability verification

This architecture ensures maintainable, scalable, and robust software that can evolve with educational needs while maintaining high code quality and performance standards.
