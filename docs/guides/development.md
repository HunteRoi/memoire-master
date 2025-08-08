# Development Guide

This guide provides comprehensive information for developers who want to contribute to PuckLab or extend its functionality.

## Development Environment Setup

### Prerequisites
- **Node.js** 18+ with npm
- **Python** 3.9+ with pip
- **Git** for version control
- **VS Code** (recommended IDE)
- **E-Puck2 robot** for development

### Environment Configuration

#### Client Development
```bash
# Clone and setup
git clone <repository-url>
cd memoire-master/src/client

# Install dependencies
npm install

# Verify setup
npm run typecheck
npm run lint
npm run check

# Start development server
npm start
```

#### Robot Server Development
```bash
# Setup Python environment
cd memoire-master/src/robot
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install black flake8

# Start development server
python main.py
```

## Project Architecture

### Overall System Design

PuckLab follows **Clean Architecture** principles with clear separation of concerns:

- **Domain Layer**: Business logic and entities (robot models, commands, states)
- **Application Layer**: Use cases and application services (robot management, connections)
- **Infrastructure Layer**: External adapters (WebSocket, file system, hardware)
- **Presentation Layer**: User interface (React components, contexts, hooks)

### Design Patterns

#### Client Application
- **Builder Pattern**: Robot entity creation with validation
- **Result/Either Monad**: Functional error handling throughout the application
- **Repository Pattern**: Data persistence abstraction
- **Container Pattern**: Dependency injection with singleton container
- **Observer Pattern**: React Context for state management
- **Strategy Pattern**: Different communication services (Mock vs WebSocket)

#### Robot Server  
- **Strategy Pattern**: Hardware interface implementations
- **State Pattern**: Robot operational state management
- **Command Pattern**: Hardware command encapsulation
- **Facade Pattern**: Unified robot service interface
- **Factory Pattern**: Hardware component creation

## Code Standards and Conventions

### TypeScript/React Standards

#### File Organization
- **Domain**: Pure business logic, no external dependencies
- **Infrastructure**: External adapters, can import domain
- **Application**: Use cases, orchestrates domain and infrastructure  
- **Presentation**: React components, hooks, and contexts

#### Naming Conventions
- **Files**: `camelCase.ts` for utilities, `PascalCase.tsx` for React components
- **Classes**: `PascalCase` (e.g., `RobotBuilder`, `ManageRobots`)
- **Interfaces**: `PascalCase` with descriptive names (e.g., `RobotCommunicationService`)
- **Types**: `PascalCase` for complex types, `camelCase` for simple aliases
- **Functions**: `camelCase` (e.g., `handleRobotConnection`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_ROBOT`)

#### Component Structure
```typescript
// Smart components (containers)
export const RobotSelectionContent: FC = () => {
  // Business logic and state management
  // Interfaces with use cases and context
};

// Dumb components (presentation)
export const RobotCard: FC<RobotCardProps> = memo(({ ... }) => {
  // Pure presentation logic
  // Memoized for performance
});
```

#### Error Handling
- Use the Result monad pattern for operations that can fail
- Create specific error classes for different error types
- Handle errors at component boundaries with Error Boundaries

### Python Standards

#### Code Style
- Follow **PEP 8** style guide
- Use **Black** for automatic formatting
- Use **Flake8** for linting
- Maximum line length: 88 characters (Black default)

#### Type Hints
- Use comprehensive type hints for all functions and methods
- Import types from `typing` module as needed
- Use `Optional[T]` for nullable types
- Use `Protocol` for structural typing when appropriate

#### Async/Await
- All I/O operations must be asynchronous
- Use `asyncio.to_thread()` for CPU-bound operations
- Proper resource cleanup with `async with` context managers
- Error handling in async contexts

### Documentation Standards

#### Code Documentation
- **TypeScript**: Use TSDoc comments for public APIs
- **Python**: Use Google-style docstrings
- **README files**: Markdown format with clear structure
- **API documentation**: Keep separate from implementation

#### Commit Messages
Follow conventional commit format:
- `feat: add new robot connection feature`
- `fix: resolve WebSocket connection timeout`
- `docs: update installation guide`
- `refactor: improve error handling in robot builder`
- `docs: add robot validation documentation`

## Development Workflows

### Feature Development

#### 1. Planning Phase
- Create or discuss GitHub issue
- Design API interfaces if needed
- Consider impact on both client and robot components
- Plan implementation approach

#### 2. Implementation Phase
- Create feature branch: `feature/robot-multi-connect`
- Implement domain logic first (pure functions, entities)
- Add infrastructure adapters
- Implement application services
- Add presentation layer
- Document new functionality

#### 3. Review Phase
- Self-review using the provided checklist
- Create pull request with detailed description
- Address review feedback
- Ensure all CI checks pass

### Debugging Techniques

#### Client Debugging
- **React DevTools**: Inspect component state and props
- **Electron DevTools**: Debug main and renderer processes
- **Network Tab**: Monitor WebSocket communications
- **Console Logging**: Structured logging with context
- **TypeScript Compiler**: Catch errors at compile time

#### Robot Server Debugging
- **Logging**: Use structured logging with different levels
- **Async Debugging**: Use `asyncio` debugging tools
- **Hardware Simulation**: Mock hardware components for development
- **WebSocket Debugging**: Use tools like `wscat` for protocol debugging
- **Performance Profiling**: Monitor resource usage and bottlenecks


## Contributing Guidelines

### Getting Started
1. **Fork the repository** and clone your fork
2. **Create a feature branch** from the develop branch
3. **Set up development environment** following this guide
4. **Make your changes** following the coding standards
5. **Verify functionality** with the application
6. **Submit a pull request** with detailed description

### Pull Request Process
1. **Description**: Clear description of changes and motivation
2. **Verification**: Include verification results and methodology
3. **Documentation**: Update relevant documentation
4. **Backward Compatibility**: Ensure changes don't break existing functionality
5. **Performance**: Consider impact on application performance

### Code Review Checklist

#### General
- [ ] Code follows established patterns and conventions
- [ ] Changes are well-documented and self-explanatory
- [ ] No commented-out code or debug statements
- [ ] Error handling is appropriate and consistent
- [ ] Performance impact has been considered

#### TypeScript/React
- [ ] Components are properly typed with interfaces
- [ ] Smart/dumb component separation is maintained
- [ ] React hooks are used correctly with proper dependencies
- [ ] Memory leaks are prevented with proper cleanup
- [ ] Performance optimizations (memo, callbacks) are appropriate

#### Python
- [ ] Type hints are comprehensive and accurate
- [ ] Async/await is used correctly for I/O operations
- [ ] Resource cleanup is handled properly
- [ ] Hardware interfaces follow established patterns
- [ ] Error handling doesn't crash the server

### Performance Considerations

#### Client Performance
- **Bundle Size**: Monitor and optimize JavaScript bundle size
- **React Performance**: Use profiler to identify rendering bottlenecks
- **Memory Usage**: Prevent memory leaks in long-running sessions
- **Network Efficiency**: Minimize WebSocket message overhead

#### Robot Server Performance  
- **Latency**: Minimize command execution latency
- **Resource Usage**: Monitor CPU and memory usage on Pi-Puck
- **Concurrent Connections**: Test with multiple simultaneous clients
- **Hardware Responsiveness**: Ensure real-time hardware control

### Security Considerations

#### Client Security
- **IPC Validation**: All inter-process communication is validated
- **Input Sanitization**: User inputs are sanitized before processing
- **Secure Storage**: Sensitive data is stored securely
- **Update Mechanism**: Secure application update process

#### Robot Server Security
- **Command Execution**: Python commands run in sandboxed environment
- **Network Security**: WebSocket connections are validated
- **Resource Limits**: Prevent resource exhaustion attacks
- **Hardware Protection**: Safe hardware access patterns

## Release Process

### Versioning Strategy
- **Semantic Versioning**: Major.Minor.Patch (e.g., 1.2.3)
- **Breaking Changes**: Major version increment
- **New Features**: Minor version increment  
- **Bug Fixes**: Patch version increment

### Release Workflow
1. **Version Bump**: Update version in package.json and relevant files
2. **Changelog**: Update CHANGELOG.md with release notes
3. **Verification**: Comprehensive verification on target platforms
4. **Build**: Create production builds for all platforms
5. **Tag**: Create git tag for the release
6. **Distribute**: Upload releases to distribution platforms

### Deployment
- **Client**: Electron Forge creates platform-specific installers
- **Robot Server**: System service deployment on Pi-Puck
- **Documentation**: Update hosted documentation
- **Support**: Prepare support materials for new release

## Advanced Topics

### Custom Block Development
For extending the visual programming interface:
- Block definition format and validation
- Code generation patterns
- Custom validation rules
- Block category organization

### Hardware Extension
For adding new E-Puck2 hardware support:
- Hardware interface patterns
- Async hardware abstraction
- Error handling in hardware layer
- Development with mock hardware

### Protocol Extension
For extending the WebSocket protocol:
- Message format versioning
- Backward compatibility maintenance
- Protocol documentation updates
- Client-server synchronization

This development guide provides the foundation for contributing to PuckLab while maintaining code quality and architectural integrity.