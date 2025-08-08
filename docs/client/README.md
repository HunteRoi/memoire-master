# Client Application Documentation

The PuckLab client is a desktop application built with React, TypeScript, and Electron, designed to provide an intuitive interface for controlling E-Puck2 robots.

## 🏗️ Architecture

The client follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/                 # Business logic and entities
│   ├── constants.ts        # Application constants
│   ├── errors.ts          # Custom error classes
│   ├── result.ts          # Result/Either pattern implementation
│   ├── robot.ts           # Robot entity and builder
│   ├── robotCommunication.ts
│   └── robotFeedback.ts
├── main/                  # Electron main process
│   ├── application/       # Use cases and interfaces
│   │   ├── interfaces/    # Abstractions
│   │   └── usecases/      # Business use cases
│   ├── infrastructure/    # External adapters
│   │   ├── communication/ # WebSocket services
│   │   ├── logging/       # Logging implementation
│   │   ├── persistence/   # File system repository
│   │   └── security/      # IPC validation
│   └── container.ts       # Dependency injection
└── presentation/          # React UI layer
    ├── components/        # Reusable UI components
    ├── containers/        # Smart components
    ├── contexts/          # React contexts
    ├── hooks/            # Custom React hooks
    ├── models/           # UI models
    ├── pages/            # Application pages
    └── providers/        # Context providers
```

## 🎯 Key Features

### Visual Programming
- Drag-and-drop interface using ReactFlow
- Block-based programming for beginners
- Real-time code generation

### Python Integration
- Built-in Python code editor
- Syntax highlighting and validation
- Direct execution on robot

### Robot Management
- Multi-robot connection support
- Real-time status monitoring
- Configuration management

### User Experience
- Multi-language support (EN, FR, DE, NL)
- Theme customization
- Age-appropriate interfaces

## 🔧 Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React | 19.1.1 |
| **Language** | TypeScript | 4.5.4 |
| **Desktop** | Electron | 37.2.6 |
| **UI Library** | Material-UI | 7.3.1 |
| **State Management** | React Context + useReducer | - |
| **Build Tool** | Webpack | - |
| **Code Quality** | Biome.js | 2.1.3 |
| **Internationalization** | i18next | 22.5.1 |

## 📱 Application Structure

### Pages
- **Splash Screen**: Loading and initialization
- **Age Selection**: Age-appropriate interface selection
- **Theme Selection**: UI theme customization
- **Mode Selection**: Choose programming mode
- **Robot Selection**: Connect and manage robots
- **Visual Programming**: Main programming interface
- **Settings**: Application preferences

### Core Components

#### Smart Components (Containers)
Located in `src/presentation/containers/`, these components handle business logic:

- **RobotSelectionContent**: Robot connection and management
- **VisualProgrammingContent**: Programming interface orchestration
- **AgeSelectionContent**: Age selection logic
- **ThemeSelectionContent**: Theme management

#### Presentation Components
Located in `src/presentation/components/`, these are pure UI components:

- **RobotCard**: Individual robot display and controls
- **RobotGrid**: Grid layout for robot cards
- **RobotDialog**: Robot configuration modal
- **Layout**: Application shell and navigation

## 🔌 API Integration

### Electron IPC API

The client communicates with the main process through a typed IPC API:

```typescript
interface ElectronAPI {
  manageRobots: {
    loadRobots(): Promise<Result<Robot[]>>;
    addRobot(robot: RobotConfig): Promise<Result<Robot[]>>;
    updateRobot(robot: RobotConfig): Promise<Result<Robot[]>>;
    removeRobot(robotId: string): Promise<Result<Robot[]>>;
  };
  robotConnection: {
    connectToRobot(robot: Robot): Promise<Result<Robot>>;
    disconnectFromRobot(robot: Robot): Promise<Result<void>>;
  };
}
```

### WebSocket Communication

Real-time communication with robots via WebSocket:

```typescript
interface RobotMessage {
  type: 'command' | 'ping' | 'status';
  data: any;
  timestamp: number;
}

interface RobotResponse {
  type: 'success' | 'error' | 'pong' | 'status';
  data?: any;
  message?: string;
  timestamp: number;
}
```

## 🎨 UI Patterns

### Result Pattern
Consistent error handling throughout the application:

```typescript
type Result<T> = Success<T> | Failure;

interface Success<T> {
  success: true;
  data: T;
}

interface Failure {
  success: false;
  error: string;
}
```

### Builder Pattern
Complex object construction with validation:

```typescript
const robotResult = Robot.create()
  .setIpAddress('192.168.1.100')
  .setPort(8765)
  .build();

if (robotResult.success) {
  const robot = robotResult.data;
  // Use robot...
}
```

### Observer Pattern
State management with React Context:

```typescript
const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

## 🚀 Performance Optimizations

### React Optimizations
- **Memoization**: `React.memo` with custom comparison functions
- **Callback Optimization**: `useCallback` for event handlers
- **Value Memoization**: `useMemo` for expensive calculations
- **Component Splitting**: Lazy loading for code splitting

### Memory Management
- **Resource Cleanup**: Proper cleanup in `useEffect`
- **Event Listeners**: Automatic removal on unmount
- **WebSocket Management**: Connection pooling and cleanup

## 🔒 Security

### IPC Validation
All IPC communications are validated:

```typescript
export class IPCValidator {
  static validateRobotConfig(data: unknown): RobotConfig {
    // Validation logic...
  }
}
```

### Input Sanitization
- User input validation at component level
- Type-safe API boundaries
- Secure execution context for Python code

## 🔧 Development Workflow

### Code Quality
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit --skipLibCheck",
    "lint": "biome lint ./src",
    "format": "biome format --write ./src",
    "check": "biome check ./src"
  }
}
```

### Build Process
- **Development**: Hot reload with Webpack
- **Production**: Optimized build with tree shaking
- **Distribution**: Cross-platform packaging with Electron Forge

## 📚 Additional Resources

- [API Reference](./api-reference.md) - Complete API documentation
- [Component Library](./components.md) - UI component documentation
- [State Management](./state-management.md) - Context and state patterns