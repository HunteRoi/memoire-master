# Code Standards

This document outlines the coding conventions and standards used throughout the PuckLab project to ensure consistency, maintainability, and code quality.

## General Principles

### Clean Code
- Write code that is self-documenting through clear naming
- Keep functions and methods small and focused
- Favor composition over complex inheritance hierarchies
- Use meaningful names for variables, functions, and classes

### SOLID Principles
All code should follow SOLID principles as implemented throughout PuckLab:
- **Single Responsibility**: Each class/function has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for their base types
- **Interface Segregation**: Clients shouldn't depend on interfaces they don't use
- **Dependency Inversion**: Depend on abstractions, not concretions

## TypeScript/JavaScript Standards

### File Organization
- Use `camelCase.ts` for utility files and modules
- Use `PascalCase.tsx` for React components
- Use `kebab-case.md` for documentation files
- Group related files in appropriate directories following Clean Architecture

### Naming Conventions
**Variables and Functions:**
```typescript
const userName = 'example';           // camelCase for variables
const MAX_RETRY_COUNT = 3;           // UPPER_SNAKE_CASE for constants
function calculateDistance() {}       // camelCase for functions
```

**Classes and Interfaces:**
```typescript
class RobotBuilder {}               // PascalCase for classes
interface RobotCommunicationService {} // PascalCase for interfaces
type RobotConfig = {};             // PascalCase for types
```

**Components:**
```typescript
export const RobotCard: FC<Props> = () => {}; // PascalCase for components
```

### TypeScript Usage
- Use strict TypeScript configuration with all strict flags enabled
- Provide explicit type annotations for public APIs
- Use union types instead of any when possible
- Implement proper error handling with Result types
- Use readonly for immutable data structures

### React Component Standards
**Smart Components (Containers):**
- Handle business logic and state management
- Located in `presentation/containers/`
- Interface with use cases and contexts
- Pass data down to presentation components

**Dumb Components (Presentation):**
- Receive all data through props
- Focus purely on presentation logic
- Located in `presentation/components/`
- Memoized with React.memo when appropriate

**Hook Standards:**
- Use custom hooks to encapsulate reusable logic
- Follow the "use" prefix convention
- Properly handle cleanup in useEffect
- Memoize expensive computations with useMemo

## Python Standards

### Code Style
- Follow PEP 8 style guide strictly
- Use Black formatter with 88-character line length
- Use meaningful variable and function names
- Organize imports according to PEP 8 (standard, third-party, local)

### Type Hints
- Use comprehensive type hints for all functions and methods
- Import types from typing module as needed
- Use Optional[T] for nullable parameters
- Use Protocol for structural typing when appropriate

### Async/Await
- All I/O operations must be asynchronous
- Use proper async context managers for resource management
- Handle async exceptions appropriately
- Use asyncio.to_thread() for CPU-bound operations in async contexts

### Class Design
- Follow single responsibility principle
- Use dataclasses for simple data containers
- Implement proper __str__ and __repr__ methods
- Use abstract base classes for interface definitions

## Error Handling Standards

### Client Error Handling
- Use Result monad pattern throughout the application
- Create specific error classes for different error types
- Handle errors at appropriate boundaries
- Provide meaningful error messages for users

### Robot Server Error Handling
- Use try-except blocks with specific exception types
- Log errors with appropriate detail level
- Implement graceful degradation for hardware failures
- Never let exceptions crash the server

## Documentation Standards

### Code Comments
- Use TSDoc for TypeScript public APIs
- Use Google-style docstrings for Python
- Comment the "why" not the "what"
- Keep comments up to date with code changes

### Commit Messages
Follow conventional commit format:
- `feat: add robot connection pooling`
- `fix: resolve memory leak in visual editor`
- `docs: update installation instructions`
- `refactor: improve error handling in domain layer`

## Performance Standards

### Client Performance
- Use React.memo for expensive components
- Memoize callbacks with useCallback
- Avoid unnecessary re-renders
- Optimize bundle size with tree shaking

### Server Performance
- Use async/await for all I/O operations
- Implement proper resource cleanup
- Monitor memory usage and prevent leaks
- Cache expensive computations when appropriate

## Security Standards

### Input Validation
- Validate all user inputs at boundaries
- Sanitize data before processing
- Use type checking as first line of defense
- Implement proper error handling for invalid inputs

### Code Execution
- Use sandboxed environments for dynamic code execution
- Whitelist allowed functions and modules
- Implement resource limits and timeouts
- Validate all commands before execution

## Architecture Standards

### Dependency Management
- Follow dependency inversion principle
- Use dependency injection for testability
- Keep dependencies at appropriate layer boundaries
- Avoid circular dependencies

### Layer Separation
- Respect Clean Architecture boundaries
- Domain layer has no external dependencies
- Infrastructure implements domain interfaces
- Application orchestrates domain and infrastructure

## Quality Assurance

### Code Review Process
- All changes must be reviewed before merging
- Check for adherence to coding standards
- Verify proper error handling
- Ensure adequate test coverage

### Automated Checks
- Use TypeScript compiler for type checking
- Use Biome.js for linting and formatting
- Use Black and Flake8 for Python code quality
- Run tests in CI/CD pipeline

## Tool Configuration

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "skipLibCheck": true
  }
}
```

### Biome Configuration
```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  }
}
```

### Python Configuration
- Use Black with default settings
- Use Flake8 with line length 88
- Use mypy for static type checking

These coding standards ensure consistency across the PuckLab codebase and facilitate collaboration among developers while maintaining the high-quality architecture that makes the project maintainable and extensible.
