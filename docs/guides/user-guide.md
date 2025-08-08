# User Guide

This comprehensive guide covers all aspects of using PuckLab to program and control E-Puck2 robots.

## Table of Contents

- [Getting Started](#getting-started)
- [Interface Overview](#interface-overview)
- [Programming Modes](#programming-modes)
- [Robot Management](#robot-management)
- [Features and Tools](#features-and-tools)
- [Educational Use](#educational-use)
- [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### First Launch

When you first launch PuckLab, you'll be guided through a setup process:

1. **Age Selection**: Choose your age group to customize the interface complexity
   - **Child (8-12)**: Simplified interface with larger buttons and basic features
   - **Teenager (13-17)**: Balanced interface with intermediate programming concepts
   - **Adult (18+)**: Full-featured interface with advanced capabilities

2. **Theme Selection**: Choose your preferred visual theme
   - **Light Theme**: Traditional bright interface
   - **Dark Theme**: Easier on the eyes for extended use
   - **Auto Theme**: Follows your system preference

3. **Mode Selection**: Choose your programming approach
   - **Visual Programming**: Block-based programming for beginners
   - **Python Mode**: Text-based programming for advanced users
   - **Hybrid Mode**: Combination of both approaches

### Initial Setup

Before programming your robot, you need to:

1. **Connect to Network**: Ensure both your computer and robot are on the same WiFi network
2. **Add Your Robot**: Configure your robot's IP address and connection settings
3. **Test Connection**: Verify communication between your computer and robot

## Interface Overview

### Main Navigation

The application uses a tab-based navigation system:

- **Robot Selection**: Manage and connect to your robots
- **Programming**: Main workspace for creating and running programs
- **Settings**: Customize application preferences and robot configurations

### Toolbar Features

The main toolbar provides quick access to essential functions:

- **Run/Stop**: Execute or halt your current program
- **Save/Load**: Manage your program files
- **Settings**: Access configuration options
- **Help**: Context-sensitive assistance

### Status Indicators

Monitor your system status through various indicators:

- **Connection Status**: Shows which robots are connected and responsive
- **Robot State**: Displays current robot operational state
- **Program Status**: Indicates if a program is running, paused, or stopped
- **Network Status**: Shows communication quality with robots

## Programming Modes

### Visual Programming Mode

Perfect for beginners and educational environments.

#### Block Categories

**Movement Blocks**:
- **Move Forward**: Makes the robot move straight ahead
- **Turn Left/Right**: Rotates the robot in place
- **Move Backward**: Makes the robot reverse
- **Stop**: Immediately stops all movement
- **Set Speed**: Controls movement speed precisely

**Sensor Blocks**:
- **Read Proximity**: Detects obstacles around the robot
- **Read Light**: Measures ambient light levels
- **Read Accelerometer**: Detects robot orientation and movement
- **Read Microphone**: Captures sound levels

**Control Blocks**:
- **If/Then/Else**: Conditional logic based on sensor readings
- **Repeat**: Loop blocks for repetitive actions
- **Wait**: Pause execution for specified time
- **Variable**: Store and use values in your program

**Output Blocks**:
- **Set LED Color**: Change robot's LED color and patterns
- **Play Sound**: Generate tones and sound effects
- **Display Message**: Show text in the console

#### Using Visual Programming

1. **Drag and Drop**: Select blocks from the palette and drag them to the workspace
2. **Connect Blocks**: Blocks snap together when compatible
3. **Configure Parameters**: Click on blocks to set values and options
4. **Test and Debug**: Run small sections to verify behavior
5. **Build Complex Programs**: Combine blocks to create sophisticated behaviors

### Python Mode

For users who want full programming control.

#### Available Libraries

PuckLab provides safe access to robot hardware through Python interfaces:

**Motor Control**:
```python
motors.set_speed(left_speed, right_speed)  # Speed range: -100 to 100
motors.stop()  # Stop both motors immediately
```

**Sensor Reading**:
```python
proximity = sensors.get_proximity()  # Returns array of 8 values
light = sensors.get_light()  # Returns array of 8 values  
accel = sensors.get_accelerometer()  # Returns [x, y, z] values
gyro = sensors.get_gyroscope()  # Returns [x, y, z] values
mic_level = sensors.get_microphone()  # Returns current sound level
```

**LED Control**:
```python
leds.set_body_led(red, green, blue)  # RGB values 0-255
leds.set_color("red", "blink")  # Color and pattern
leds.set_front_led(True)  # Enable/disable front LED
```

**Audio Output**:
```python
audio.play_tone(frequency, duration, volume)  # Generate tone
audio.play_beep()  # Quick beep sound
audio.play_error_sound()  # Error indicator sound
```

#### Python Programming Tips

1. **Start Simple**: Begin with basic movement commands
2. **Use Comments**: Document your code for future reference
3. **Test Incrementally**: Test each section before adding complexity
4. **Handle Errors**: Use try-except blocks for robust programs
5. **Organize Code**: Use functions to structure your program

### Hybrid Mode

Combines the best of both approaches.

#### Block-to-Code Translation

- Create program structure with visual blocks
- Add custom Python code within special code blocks
- See generated Python code in real-time
- Switch seamlessly between visual and text editing

#### Educational Progression

1. **Start Visual**: Build confidence with drag-and-drop programming
2. **Add Code Blocks**: Introduce custom Python snippets
3. **View Generated Code**: Understand the Python equivalent
4. **Transition to Text**: Gradually work more in Python mode
5. **Full Programming**: Eventually work entirely in Python

## Robot Management

### Adding Robots

1. **Click "Add Robot"**: Opens the robot configuration dialog
2. **Enter IP Address**: Input your robot's network address
3. **Set Port**: Usually 8765 (the default WebSocket port)
4. **Test Connection**: Verify the robot responds correctly
5. **Save Configuration**: Store the robot settings for future use

### Connection Management

**Connection States**:
- **Disconnected**: Robot is configured but not connected
- **Connecting**: Attempting to establish connection
- **Connected**: Robot is ready for programming
- **Active**: Robot is currently executing commands
- **Error**: Connection failed or robot is unresponsive

**Connection Actions**:
- **Connect**: Establish communication with the robot
- **Disconnect**: Close the connection safely
- **Reconnect**: Re-establish a dropped connection
- **Remove**: Delete robot from configuration

### Multi-Robot Support

PuckLab supports controlling multiple robots simultaneously:

1. **Add Multiple Robots**: Configure each robot with unique IP addresses
2. **Select Active Robot**: Choose which robot receives commands
3. **Broadcast Commands**: Send the same program to all connected robots
4. **Individual Control**: Program each robot independently

## Features and Tools

### Program Editor

**Visual Editor Features**:
- **Block Palette**: Organized categories of programming blocks
- **Workspace**: Drag-and-drop canvas for building programs
- **Properties Panel**: Configure block parameters and settings
- **Zoom Controls**: Navigate large programs easily

**Text Editor Features**:
- **Syntax Highlighting**: Python code is color-coded for readability
- **Auto-completion**: Suggests available functions and variables
- **Error Highlighting**: Highlights syntax errors as you type
- **Line Numbers**: Easy reference for debugging

### Console and Debugging

**Program Output**:
- View print statements and program output
- Monitor sensor readings in real-time
- See error messages and stack traces
- Track program execution flow

**Debugging Tools**:
- **Step-by-step Execution**: Run programs one command at a time
- **Variable Inspection**: View current variable values
- **Breakpoints**: Pause execution at specific points
- **Error Reporting**: Detailed error messages with suggestions

### File Management

**Save and Load**:
- Save programs to local files
- Load previously created programs
- Export programs for sharing
- Import programs from others

**Program Organization**:
- Create folders to organize projects
- Add descriptions and tags to programs
- Search and filter saved programs
- Version control for program revisions

## Educational Use

### Age-Appropriate Learning

**Children (8-12)**:
- **Focus**: Basic cause-and-effect programming
- **Activities**: Simple movement patterns, obstacle avoidance
- **Skills**: Logical thinking, problem-solving basics
- **Interface**: Large buttons, simple vocabulary, visual feedback

**Teenagers (13-17)**:
- **Focus**: Programming concepts and computational thinking
- **Activities**: Complex behaviors, sensor integration, algorithms
- **Skills**: Programming logic, debugging, system thinking
- **Interface**: Balanced complexity, intermediate terminology

**Adults (University/Professional)**:
- **Focus**: Advanced programming and robotics concepts
- **Activities**: Research applications, complex algorithms, system integration
- **Skills**: Professional programming, advanced robotics, system design
- **Interface**: Full feature access, technical terminology

### Classroom Integration

**Lesson Planning**:
- Start with simple concepts and build complexity gradually
- Combine individual and group activities
- Include both programming and robotics concepts
- Assess learning through project-based evaluation

**Assessment Tools**:
- Program complexity metrics
- Problem-solving approach evaluation
- Collaborative skills assessment
- Technical knowledge verification

**Curriculum Integration**:
- **Mathematics**: Geometry, measurement, coordinate systems
- **Science**: Physics concepts, sensor principles, data analysis
- **Technology**: Programming concepts, system design, debugging
- **Engineering**: Problem-solving, design thinking, iteration

## Tips and Best Practices

### Programming Best Practices

1. **Start Small**: Begin with simple programs and add complexity gradually
2. **Test Frequently**: Run programs often to catch errors early
3. **Use Meaningful Names**: Choose descriptive names for variables and functions
4. **Comment Your Code**: Explain complex logic for future reference
5. **Plan Before Coding**: Think through the logic before implementing

### Robot Operation Tips

1. **Battery Management**: Keep robot batteries charged for consistent performance
2. **Surface Preparation**: Use clean, flat surfaces for predictable movement
3. **Lighting Conditions**: Ensure good lighting for camera and light sensors
4. **Network Stability**: Maintain strong WiFi connection for reliable communication
5. **Safety First**: Always supervise robot operation, especially with children

### Troubleshooting Common Issues

**Connection Problems**:
- Verify network connectivity between computer and robot
- Check that robot server is running and responsive
- Confirm IP address and port settings are correct
- Restart both application and robot if necessary

**Program Execution Issues**:
- Check for syntax errors in Python code
- Verify that all required blocks are properly connected
- Ensure robot has sufficient battery power
- Look for error messages in the console

**Performance Issues**:
- Close unnecessary applications to free system resources
- Check network bandwidth and reduce other network activity
- Restart the application if it becomes unresponsive
- Update to the latest version for performance improvements

### Getting Help

**Built-in Help**:
- Context-sensitive help bubbles throughout the interface
- Example programs demonstrating common techniques
- Error messages with suggestions for resolution
- Integrated tutorials for new users

**Community Resources**:
- Online documentation and guides
- User forums and discussion groups
- Video tutorials and demonstrations
- Educational resource sharing

**Technical Support**:
- Comprehensive troubleshooting guides
- System diagnostic tools
- Log file analysis for complex issues
- Contact information for additional support

This user guide provides comprehensive coverage of PuckLab's features and capabilities, helping users of all levels successfully program and control E-Puck2 robots for educational and research purposes.