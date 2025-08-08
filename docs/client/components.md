# Component Library

This document provides documentation for the React components used in the PuckLab client application.

## Component Architecture

PuckLab follows a strict separation between smart (container) and dumb (presentation) components to ensure maintainability and reusability.

### Smart Components (Containers)

Smart components are located in [`src/presentation/containers/`](../../src/client/src/presentation/containers/) and handle business logic and state management.

#### RobotSelectionContent
Located in [`robotSelectionContent.tsx`](../../src/client/src/presentation/containers/robotSelectionContent.tsx)

**Purpose**: Orchestrates robot selection, connection, and management workflows.

**Responsibilities**:
- Robot CRUD operations through useRobotManagement hook
- Connection state management and user feedback
- Dialog state management for robot configuration
- Integration with application context for global state updates

**Key Features**:
- Handles robot addition, editing, and removal
- Manages connection and disconnection flows
- Provides user feedback through alerts and loading states
- Supports robot connection validation and recovery

#### VisualProgrammingContent
Located in [`visualProgrammingContent.tsx`](../../src/client/src/presentation/containers/visualProgrammingContent.tsx)

**Purpose**: Main programming interface orchestration.

**Responsibilities**:
- Programming mode management (visual, Python, hybrid)
- Code execution and robot communication
- Console and output management
- Block palette and workspace coordination

#### AgeSelectionContent
Located in [`ageSelectionContent.tsx`](../../src/client/src/presentation/containers/ageSelectionContent.tsx)

**Purpose**: Age-appropriate interface selection.

**Responsibilities**:
- Age group selection and validation
- Interface complexity configuration
- User preference persistence
- Navigation to next setup step

#### ThemeSelectionContent
Located in [`themeSelectionContent.tsx`](../../src/client/src/presentation/containers/themeSelectionContent.tsx)

**Purpose**: Theme customization and preview.

**Responsibilities**:
- Theme selection and application
- Real-time theme preview
- Theme preference persistence
- Integration with Material-UI theme provider

### Presentation Components

Presentation components are located in [`src/presentation/components/`](../../src/client/src/presentation/components/) and focus purely on UI rendering and user interaction.

#### RobotCard
Located in [`robot/card.tsx`](../../src/client/src/presentation/components/robot/card.tsx)

**Purpose**: Individual robot display and interaction.

**Props**:
- `robot`: Robot entity to display
- `onSelect`: Callback for robot selection
- `onEdit`: Callback for editing robot configuration
- `onDelete`: Callback for robot removal
- `onDisconnect`: Callback for disconnecting from robot
- `selected`: Boolean indicating if robot is currently selected
- `connected`: Boolean indicating connection status
- `labels`: Internationalized labels for accessibility

**Features**:
- Connection status visualization with color-coded indicators
- Accessible keyboard navigation and screen reader support
- Memoized performance optimization with custom comparison
- Context menu actions for robot management
- Responsive design for different screen sizes

#### RobotGrid
Located in [`robot/robotGrid.tsx`](../../src/client/src/presentation/components/robot/robotGrid.tsx)

**Purpose**: Grid layout for robot cards with add functionality.

**Features**:
- Responsive grid layout that adapts to screen size
- Add robot card for creating new robot configurations
- Efficient rendering with virtualization for large robot lists
- Drag and drop support for robot reordering
- Keyboard navigation between robot cards

#### RobotDialog
Located in [`robot/dialog.tsx`](../../src/client/src/presentation/components/robot/dialog.tsx)

**Purpose**: Modal dialog for robot configuration (add/edit robots).

**Features**:
- Form validation with real-time feedback
- IP address format validation and suggestions
- Port number validation with common port suggestions
- Connection validation with progress indication
- Accessibility features including focus management and screen reader support

#### RobotConnectionDialog
Located in [`robot/robotConnectionDialog.tsx`](../../src/client/src/presentation/components/robot/robotConnectionDialog.tsx)

**Purpose**: Confirmation dialog for connecting to robots.

**Features**:
- Connection confirmation workflow
- Loading states during connection attempts
- User-friendly connection messaging
- Cancel functionality during connection process

#### AddRobotCard
Located in [`robot/addRobotCard.tsx`](../../src/client/src/presentation/components/robot/addRobotCard.tsx)

**Purpose**: Special card for initiating robot addition.

**Features**:
- Prominent visual design to encourage robot addition
- Keyboard accessible with proper ARIA attributes
- Consistent styling with existing robot cards
- Hover and focus states for better user experience

### Layout Components

#### Layout
Located in [`layout/layout.tsx`](../../src/client/src/presentation/components/layout/layout.tsx)

**Purpose**: Application shell and navigation structure.

**Features**:
- Responsive sidebar navigation
- Header with application title and user actions
- Main content area with proper spacing and overflow handling
- Footer with status information and quick actions
- Integration with theme system for consistent styling

#### AlertSnackbar
Located in [`layout/alertSnackbar.tsx`](../../src/client/src/presentation/components/layout/alertSnackbar.tsx)

**Purpose**: Global notification system.

**Features**:
- Multiple severity levels (info, warning, error, success)
- Auto-dismiss functionality with configurable duration
- Queue management for multiple simultaneous alerts
- Accessible announcements for screen readers
- Action buttons for user interaction

### Visual Programming Components

#### BlocksPanel
Located in [`visualProgramming/blocksPanel.tsx`](../../src/client/src/presentation/components/visualProgramming/blocksPanel.tsx)

**Purpose**: Palette of available programming blocks.

**Features**:
- Categorized block organization (Movement, Sensors, Logic, etc.)
- Search and filter functionality
- Drag and drop block creation
- Block documentation and examples
- Responsive panel that adapts to available space

#### ConsolePanel
Located in [`visualProgramming/consolePanel.tsx`](../../src/client/src/presentation/components/visualProgramming/consolePanel.tsx)

**Purpose**: Program output and debugging information display.

**Features**:
- Real-time output streaming from robot
- Message categorization (info, warning, error)
- Search and filter capabilities
- Export functionality for debugging
- Auto-scroll with manual override option

#### PythonCodeViewer
Located in [`visualProgramming/pythonCodeViewer.tsx`](../../src/client/src/presentation/components/visualProgramming/pythonCodeViewer.tsx)

**Purpose**: Display generated Python code from visual programming blocks.

**Features**:
- Fixed overlay display for generated code
- Code syntax display with proper formatting
- Close/dismiss functionality
- Responsive positioning for different screen sizes

#### ScriptPanel
Located in [`visualProgramming/scriptPanel.tsx`](../../src/client/src/presentation/components/visualProgramming/scriptPanel.tsx)

**Purpose**: Script execution and management interface.

**Features**:
- Script execution controls
- Integration with robot communication
- Error handling and display
- Script state management

### Utility Components

#### EPuck2Robot
Located in [`EPuck2Robot.tsx`](../../src/client/src/presentation/components/EPuck2Robot.tsx)

**Purpose**: Visual representation of E-Puck2 robot.

**Features**:
- SVG-based robot visualization
- Real-time sensor value display
- Interactive sensor and actuator controls
- Animation support for movement visualization
- Customizable appearance and scaling

#### LanguageSelector
Located in [`languageSelector.tsx`](../../src/client/src/presentation/components/languageSelector.tsx)

**Purpose**: Language selection dropdown with flag icons.

**Features**:
- Flag icons for visual language identification
- Smooth transitions between languages
- Persistence of language preference
- Accessibility support with proper ARIA labels
- Integration with i18next translation system

#### ModeCard
Located in [`modeCard.tsx`](../../src/client/src/presentation/components/modeCard.tsx)

**Purpose**: Programming mode selection cards.

**Features**:
- Visual representation of different programming modes
- Preview screenshots or animations
- Difficulty level indicators
- Age-appropriate recommendations
- Hover effects and smooth transitions

#### ThemePreviewCard
Located in [`themePreviewCard.tsx`](../../src/client/src/presentation/components/themePreviewCard.tsx)

**Purpose**: Theme selection cards with preview.

**Features**:
- Visual theme preview with color swatches
- Radio button selection interface
- Theme name and description display
- Responsive card layout
- Accessibility support for selection

#### TabPanel
Located in [`tabPanel.tsx`](../../src/client/src/presentation/components/tabPanel.tsx)

**Purpose**: Accessible tab panel implementation.

**Features**:
- WCAG 2.1 compliant tab navigation
- Keyboard navigation with arrow keys
- Proper focus management
- Screen reader support
- Customizable styling and animations

## Component Patterns

### Performance Optimizations

**Memoization**: Components use React.memo with custom comparison functions to prevent unnecessary re-renders. The RobotCard component demonstrates this pattern with comprehensive prop comparison.

**Callback Optimization**: Event handlers are memoized with useCallback to prevent prop changes that would trigger child re-renders.

**Value Memoization**: Expensive calculations and derived values are cached with useMemo to avoid repeated computation.

### Accessibility Patterns

**ARIA Attributes**: All interactive components include proper ARIA labels, roles, and states for screen reader compatibility.

**Keyboard Navigation**: Components support full keyboard navigation with logical tab order and appropriate keyboard shortcuts.

**Focus Management**: Modal dialogs and dynamic content properly manage focus to maintain accessibility.

### Internationalization Patterns

**Translation Integration**: Components use the useTranslation hook for all user-facing text with fallback values for missing translations.

**RTL Support**: Components are designed to work with right-to-left languages through CSS logical properties.

**Cultural Adaptation**: Date, number, and currency formatting adapt to user locale preferences.

### Error Boundary Integration

**Error Isolation**: Components are wrapped in error boundaries to prevent cascading failures and provide graceful degradation.

**Error Recovery**: Error boundaries provide user-friendly error messages with recovery actions when possible.

This component library provides a comprehensive set of reusable, accessible, and performant React components that support the educational goals and technical requirements of the PuckLab application.