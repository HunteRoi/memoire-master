# State Management

This document describes the state management patterns and architecture used in the PuckLab client application.

## Overview

PuckLab uses React Context with useReducer for global state management, following functional programming principles and providing type-safe state updates throughout the application.

## State Architecture

### Context-Based State Management

The application uses React Context API as the primary state management solution, implemented in [`src/presentation/contexts/appContext.tsx`](../../src/client/src/presentation/contexts/appContext.tsx).

**Advantages of Context API**:
- Built-in React solution with no external dependencies
- Type-safe with TypeScript integration
- Excellent performance when properly optimized
- Natural integration with React component lifecycle
- Simplified debugging with React DevTools

### State Structure

The global application state is centralized in the AppState interface:

**Core State Properties**:
- **theme**: Current visual theme (light, dark, auto)
- **language**: Selected interface language with i18next integration
- **userAge**: Age group selection affecting interface complexity
- **selectedMode**: Programming mode (visual, Python, hybrid)
- **selectedRobot**: Currently selected robot ID for operations
- **robots**: Array of configured robot entities
- **connectedRobots**: Set of robot IDs that are currently connected
- **isLoading**: Global loading state for UI feedback
- **error**: Current error message for user display
- **alert**: Snackbar alert configuration for notifications

## Reducer Pattern

### Action-Based State Updates

State modifications follow the reducer pattern with strictly typed actions defined in the AppAction union type. This ensures predictable state changes and makes debugging easier.

**Action Categories**:

**User Preferences**:
- SET_THEME: Updates visual theme preference
- SET_LANGUAGE: Changes interface language
- SET_USER_AGE: Modifies age group selection

**Robot Management**:
- SET_SELECTED_ROBOT: Changes currently active robot
- SET_SELECTED_MODE: Updates programming mode
- SET_ROBOTS_LIST: Replaces entire robot list
- ADD_CONNECTED_ROBOT: Adds robot to connected set
- REMOVE_CONNECTED_ROBOT: Removes robot from connected set

**UI State**:
- SET_LOADING: Controls global loading indicator
- SET_ERROR: Sets error message for display
- SHOW_ALERT: Displays notification with severity level
- HIDE_ALERT: Dismisses current notification

**Application Lifecycle**:
- RESET_STATE: Returns to initial application state

### Reducer Implementation

The reducer function handles all state transitions with immutable updates, ensuring React can properly detect changes and trigger re-renders only when necessary.

**Key Principles**:
- Pure function with no side effects
- Immutable state updates using spread operator
- Comprehensive action type coverage
- Default case handling for unknown actions

## Context Provider

### AppProvider Implementation

The AppProvider component in [`src/presentation/providers/appProvider.tsx`](../../src/client/src/presentation/providers/appProvider.tsx) wraps the entire application and provides state management capabilities.

**Provider Responsibilities**:
- State initialization from localStorage
- Context value optimization to prevent unnecessary re-renders
- Integration with external systems (i18next, theme provider)
- Error boundary integration for robust error handling

**Performance Optimizations**:
- Context value memoization to prevent provider re-renders
- Selective state updates to minimize child component re-renders
- Lazy initialization for expensive state calculations

### Context Access

Components access the global state through the useAppContext hook in [`src/presentation/hooks/useAppContext.ts`](../../src/client/src/presentation/hooks/useAppContext.ts).

**Hook Features**:
- Type-safe context access with proper error handling
- Runtime validation that hook is used within provider
- Automatic TypeScript inference for context properties
- Integration with React DevTools for debugging

## State Persistence

### LocalStorage Integration

The application automatically persists user preferences to localStorage for a consistent experience across sessions.

**Persisted State**:
- Theme preference with system detection fallback
- Language selection with browser language detection
- User age group for interface customization
- Robot configurations and connection history

**Persistence Strategy**:
- Automatic saving on state changes with debouncing
- Error handling for localStorage limitations (private browsing)
- Graceful fallback to default values when persistence fails
- Data migration for configuration format changes

## Custom Hooks

### useRobotManagement Hook

The useRobotManagement hook in [`src/presentation/hooks/useRobotManagement.ts`](../../src/client/src/presentation/hooks/useRobotManagement.ts) provides high-level robot management operations.

**Hook Capabilities**:
- CRUD operations for robot configurations
- Connection lifecycle management
- Error handling with user feedback
- Performance optimization with memoized callbacks

**State Integration**:
- Reads robot state from global context
- Updates global state through context actions
- Provides derived state for component consumption
- Handles asynchronous operations with loading states

### useEnsureData Hook

The useEnsureData hook in [`src/presentation/hooks/useEnsureData.ts`](../../src/client/src/presentation/hooks/useEnsureData.ts) ensures required application data is loaded on startup.

**Data Loading Strategy**:
- Parallel loading of independent data sources
- Error handling with retry mechanisms
- Loading state coordination for smooth user experience
- Cache invalidation and refresh capabilities

## Performance Considerations

### Re-render Optimization

**Context Splitting**: The application uses a single context but provides multiple access patterns to minimize re-renders when only specific state slices change.

**Memoization Strategies**:
- Context value memoization in the provider
- Component memoization with React.memo
- Callback memoization with useCallback
- Value memoization with useMemo

**State Update Batching**: Related state updates are batched together to minimize the number of re-renders and improve performance.

### Memory Management

**State Cleanup**: The application properly cleans up state references and subscriptions to prevent memory leaks in long-running sessions.

**Resource Management**: Large objects like robot configurations are handled efficiently with proper garbage collection patterns.

## Error Handling

### Error Boundaries Integration

State management integrates with React Error Boundaries to provide graceful error handling and recovery.

**Error Recovery Strategies**:
- State reset functionality for critical errors
- Partial state recovery for non-critical failures
- User notification with recovery guidance
- Automatic error reporting for debugging

### Async Error Handling

Asynchronous operations like robot communications are handled with proper error boundaries and user feedback.

**Error Handling Patterns**:
- Try-catch blocks with Result monad integration
- User-friendly error messages with context
- Retry mechanisms for transient failures
- Fallback strategies for critical functionality

## Development Patterns

### State Debugging

The state management system provides excellent debugging capabilities:

**Development Tools**:
- React DevTools integration for state inspection
- Time-travel debugging with state history
- Action logging in development mode
- Performance profiling for state updates

**Debugging Strategies**:
- Comprehensive logging for state changes
- Action replay for issue reproduction
- State snapshots for complex debugging scenarios
- Integration with browser debugging tools

### State Migration

The application handles state schema changes gracefully:

**Migration Strategies**:
- Version-based state migration
- Backward compatibility for older state formats
- Gradual migration with feature flags
- Rollback capabilities for failed migrations

## Integration with External Systems

### i18next Integration

State management coordinates with the i18next internationalization system:

**Language Management**:
- Synchronized language state with i18next
- Browser language detection and fallback
- Dynamic language switching without restart
- Translation loading state management

### Theme Integration

Theme state integrates with Material-UI's theme provider:

**Theme Coordination**:
- Synchronized theme state with Material-UI
- System theme detection and following
- Smooth theme transitions with animations
- Theme persistence across application restarts

This state management architecture provides a robust, type-safe, and performant foundation for the PuckLab application while maintaining simplicity and developer experience.