# Client API Reference

This document provides a comprehensive reference for the PuckLab client application APIs.

## Table of Contents

- [Electron IPC API](#electron-ipc-api)
- [Domain Models](#domain-models)
- [Use Cases](#use-cases)
- [React Context API](#react-context-api)
- [Custom Hooks](#custom-hooks)

## Electron IPC API

The client exposes a type-safe IPC API through the `window.electronAPI` object. This API provides the bridge between the React renderer process and the Electron main process.

### Robot Management API

The robot management API handles all operations related to robot configuration and persistence. Implementation can be found in [`src/main/application/usecases/manageRobots.ts`](../../src/client/src/main/application/usecases/manageRobots.ts).

#### loadRobots()
**Returns**: `Promise<Result<RobotConfig[]>>`

Loads all configured robots from the filesystem storage. Returns a Result type containing either the list of robot configurations or an error message.

#### addRobot(robot: RobotConfig)
**Parameters**: `robot: RobotConfig` - Robot configuration to add
**Returns**: `Promise<Result<RobotConfig[]>>`

Adds a new robot configuration to the system. Validates the robot configuration using the Robot Builder pattern before persistence. Returns updated list of all robots.

#### updateRobot(robot: RobotConfig) 
**Parameters**: `robot: RobotConfig` - Updated robot configuration
**Returns**: `Promise<Result<RobotConfig[]>>`

Updates an existing robot configuration. Performs validation to ensure the robot exists before updating. Returns updated list of all robots.

#### removeRobot(robotId: string)
**Parameters**: `robotId: string` - ID of the robot to remove
**Returns**: `Promise<Result<RobotConfig[]>>`

Removes a robot configuration by ID. Prevents removal of the default robot to maintain system integrity. Returns updated list of remaining robots.

#### clearRobots()
**Returns**: `Promise<Result<RobotConfig[]>>`

Removes all robot configurations and restores the default robot. Returns the reset robot list.

#### findRobotById(robotId: string)
**Parameters**: `robotId: string` - ID of the robot to find
**Returns**: `Promise<Result<RobotConfig>>`

Finds a specific robot configuration by ID. Returns the robot configuration or an error if not found.

### Robot Connection API

Handles real-time connections to E-Puck2 robots via WebSocket communication. Implementation details are in [`src/main/application/usecases/manageRobotConnection.ts`](../../src/client/src/main/application/usecases/manageRobotConnection.ts).

#### connectToRobot(robot: RobotConfig)
**Parameters**: `robot: RobotConfig` - Robot configuration to connect to
**Returns**: `Promise<Result<RobotConfig>>`

Establishes a WebSocket connection to the specified robot. Handles connection timeouts and error states. Returns the connected robot configuration or error details.

#### disconnectFromRobot(robot: RobotConfig)
**Parameters**: `robot: RobotConfig` - Robot configuration to disconnect from  
**Returns**: `Promise<Result<RobotConfig>>`

Safely closes the WebSocket connection and cleans up resources. Returns the disconnected robot configuration.

#### checkConnection(robot: RobotConfig)
**Parameters**: `robot: RobotConfig` - Robot configuration to check
**Returns**: `Promise<Result<boolean>>`

Tests the connection to a robot without establishing a persistent connection. Useful for validating robot configurations.

#### sendCommand(robotConfig: RobotConfig, command: string)
**Parameters**: 
- `robotConfig: RobotConfig` - Target robot configuration
- `command: string` - Python command to execute on the robot
**Returns**: `Promise<unknown>`

Sends a Python command to the connected robot for execution. Returns the execution result or throws an error.

#### subscribeToFeedback(robotConfig: RobotConfig)
**Parameters**: `robotConfig: RobotConfig` - Robot to subscribe to
**Returns**: `Promise<boolean>`

Subscribes to real-time feedback from the specified robot. Use with `onFeedback` callback to receive updates.

#### unsubscribeFromFeedback(robotConfig: RobotConfig)  
**Parameters**: `robotConfig: RobotConfig` - Robot to unsubscribe from
**Returns**: `Promise<boolean>`

Unsubscribes from robot feedback updates.

#### onFeedback(callback: (feedback: RobotFeedback) => void)
**Parameters**: `callback` - Function to handle robot feedback
**Returns**: `void`

Registers a callback function to receive real-time robot feedback including sensor readings and status updates.

#### removeFeedbackListener()
**Returns**: `void`

Removes the current feedback listener callback.

### Python Code Viewer API

Manages the Python code viewer window for displaying generated code from visual programming.

#### openWindow(code: string, title?: string)
**Parameters**: 
- `code: string` - Python code to display
- `title?: string` - Optional window title
**Returns**: `Promise<boolean>`

Opens a new Python code viewer window with the specified code content.

#### updateCode(code: string)
**Parameters**: `code: string` - Updated Python code to display
**Returns**: `Promise<boolean>`

Updates the code content in the currently open Python code viewer window.

#### closeWindow()
**Returns**: `Promise<boolean>`

Closes the Python code viewer window if it's currently open.

### Application API

General application-level functionality.

#### app.isPackaged()
**Returns**: `Promise<boolean>`

Checks if the application is running in packaged (production) mode or development mode.

## Domain Models

### Robot Entity

The core business entity representing an E-Puck2 robot. The Robot class is implemented in [`src/domain/robot.ts`](../../src/client/src/domain/robot.ts) and includes:

- **Properties**: IP address, port number
- **Derived Values**: Auto-generated ID based on IP address, human-readable name
- **Builder Pattern**: Static factory method for creating validated instances

### Robot Builder

Implements the Builder pattern with comprehensive validation for:
- IPv4 address format validation
- Port range validation (1-65535)
- Reserved address checking
- Error accumulation and reporting

### Result Pattern (Monad Implementation)

Functional error handling pattern used throughout the application, defined in [`src/domain/result.ts`](../../src/client/src/domain/result.ts). This is a monad implementation that eliminates the need for try-catch blocks and provides consistent error handling across all operations.

## Use Cases

### Robot Management Use Case

Located in [`src/main/application/usecases/manageRobots.ts`](../../src/client/src/main/application/usecases/manageRobots.ts), this use case orchestrates all robot configuration operations:

- **Loading**: Retrieves robots from repository with error handling
- **Adding**: Validates new robots and prevents duplicates
- **Updating**: Ensures robot exists before modification
- **Removing**: Protects system integrity by preventing default robot removal
- **Searching**: Finds robots by ID with proper error reporting

### Robot Connection Use Case

Implemented in [`src/main/application/usecases/manageRobotConnection.ts`](../../src/client/src/main/application/usecases/manageRobotConnection.ts), manages the lifecycle of robot connections:

- **Connection Establishment**: WebSocket connection with timeout handling
- **Health Monitoring**: Periodic ping/pong to ensure connection health
- **Command Execution**: Sends Python commands to robots safely
- **Graceful Shutdown**: Proper resource cleanup on disconnection

## React Context API

### Application Context

The central state management solution using React Context with useReducer. Implementation is in [`src/presentation/contexts/appContext.tsx`](../../src/client/src/presentation/contexts/appContext.tsx).

#### State Management
- **Theme Management**: Light, dark, and auto theme switching
- **Internationalization**: Multi-language support with i18next integration
- **Robot State**: Connected robots tracking and selection management
- **UI State**: Loading states, error handling, and alert notifications

#### State Actions
All state modifications go through a reducer pattern with strictly typed actions for:
- User preferences (theme, language, age)
- Robot management (selection, connection status)
- UI feedback (loading, errors, alerts)
- Application lifecycle (initialization, reset)

### App Provider

The provider component in [`src/presentation/providers/appProvider.tsx`](../../src/client/src/presentation/providers/appProvider.tsx) wraps the entire application and provides:
- State initialization from localStorage
- Automatic data loading on startup
- Error boundary integration
- Context value optimization to prevent unnecessary re-renders

## Custom Hooks

### useAppContext Hook

Provides type-safe access to the application context, implemented in [`src/presentation/hooks/useAppContext.ts`](../../src/client/src/presentation/hooks/useAppContext.ts). Throws a descriptive error if used outside of the provider.

### useRobotManagement Hook

High-level hook for robot operations, found in [`src/presentation/hooks/useRobotManagement.ts`](../../src/client/src/presentation/hooks/useRobotManagement.ts). Provides:

- **State Access**: Current robots list, selected robot, connection status
- **Operations**: CRUD operations for robots with error handling
- **Connection Management**: Connect, disconnect, and test robot connections
- **Performance Optimization**: Memoized callbacks and return values

### useEnsureData Hook

Data loading hook in [`src/presentation/hooks/useEnsureData.ts`](../../src/client/src/presentation/hooks/useEnsureData.ts) ensures required application data is loaded on component mount:
- Robot configurations from storage
- User theme preferences
- Language settings
- Default application state

## Error Handling

### Custom Error Classes

Domain-specific error classes are defined in [`src/domain/errors.ts`](../../src/client/src/domain/errors.ts):

- **RobotValidationError**: Field-level validation failures
- **RobotConfigurationError**: Configuration and persistence errors  
- **RobotCommunicationError**: WebSocket and network errors

Each error class includes contextual information for debugging and user feedback.

### Error Boundaries

React Error Boundaries are implemented in [`src/presentation/components/GlobalErrorBoundary.tsx`](../../src/client/src/presentation/components/GlobalErrorBoundary.tsx) to catch and gracefully handle rendering errors.

## Component Architecture

### Smart vs Dumb Components

The application follows a strict separation between container (smart) and presentation (dumb) components:

#### Container Components
Located in [`src/presentation/containers/`](../../src/client/src/presentation/containers/), these components:
- Handle business logic and state management
- Interface with use cases and context
- Orchestrate user interactions
- Example: `robotSelectionContent.tsx` manages robot selection logic

#### Presentation Components
Located in [`src/presentation/components/`](../../src/client/src/presentation/components/), these components:
- Receive data via props
- Handle UI interactions through callbacks
- Focus purely on presentation
- Are highly reusable and testable
- Example: `RobotCard` displays robot information and handles UI events

### Performance Optimizations

Components implement several performance optimization techniques:
- **React.memo**: Prevents unnecessary re-renders with custom comparison functions
- **useCallback**: Memoizes event handlers to prevent prop changes
- **useMemo**: Caches expensive calculations and derived values
- **Component Splitting**: Lazy loading for code splitting where appropriate

## Internationalization

The i18n system is configured in [`src/presentation/i18n/index.ts`](../../src/client/src/presentation/i18n/index.ts) with:
- **Language Detection**: Automatic browser language detection
- **Fallback System**: English as default with graceful degradation
- **Hot Reloading**: Dynamic language switching without restart
- **Namespace Support**: Organized translations by feature area

Translation files are located in [`src/presentation/i18n/locales/`](../../src/client/src/presentation/i18n/locales/) for English, French, German, and Dutch.

## Security Considerations

### IPC Validation

All Inter-Process Communication is validated using the security module in [`src/main/infrastructure/security/ipcValidator.ts`](../../src/client/src/main/infrastructure/security/ipcValidator.ts) to prevent injection attacks and ensure data integrity.

### Input Sanitization

User inputs are validated at multiple layers:
- **Domain Level**: Business rule validation in entity builders
- **Component Level**: UI validation with immediate feedback
- **IPC Level**: Security validation before main process execution

This comprehensive API reference covers all major interfaces and patterns used in the PuckLab client application.