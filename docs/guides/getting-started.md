# Getting Started with PuckLab

Welcome to PuckLab! This guide will help you get up and running quickly with controlling E-Puck2 robots.

## What is PuckLab?

PuckLab is an educational interface designed to control E-Puck2 robots at UNamur. It provides both visual programming concepts and advanced Python tooling to simplify access and development of specific scenarios for robotics education.

## Quick Start (5 Minutes)

### Prerequisites Checklist
- [ ] E-Puck2 robot with Pi-Puck extension
- [ ] Both robot and computer connected to the same WiFi network
- [ ] Node.js 18+ installed on your computer
- [ ] Python 3.9+ installed on the robot

### 1. Download and Install

**For the Client Application:**
```bash
# Clone the repository
git clone <repository-url>
cd memoire-master/src/client

# Install dependencies
npm install

# Start the application
npm start
```

**For the Robot Server:**
```bash
# On your E-Puck2 robot
cd ~/pucklab-server
source venv/bin/activate
python main.py
```

### 2. Connect Your First Robot

1. **Launch PuckLab** - The desktop application will open
2. **Select your age group** - Choose the appropriate interface complexity
3. **Choose a theme** - Pick your preferred visual theme
4. **Select programming mode** - Start with "Visual Programming" for beginners
5. **Add your robot**:
   - Click "Add New Robot"
   - Enter your robot's IP address (check robot's network settings)
   - Use port 8765 (default)
   - Click "Test Connection" to verify
   - Save the robot configuration

### 3. Your First Program

**Visual Programming Mode:**
1. Navigate to the Visual Programming interface
2. Drag a "Move Forward" block to the workspace
3. Set the speed to 50
4. Click "Run" to execute the program
5. Watch your robot move!

**Python Mode:**
1. Switch to Python mode in the interface
2. Type: `motors.set_speed(50, 50)`
3. Click "Execute" or press Ctrl+Enter
4. Your robot will move forward

## Understanding the Interface

### Main Navigation
- **Age Selection**: Choose between child, teenager, and adult interfaces
- **Theme Selection**: Customize the visual appearance
- **Mode Selection**: Choose between Visual Programming, Python, or Hybrid modes
- **Robot Selection**: Manage and connect to your robots
- **Programming Interface**: The main workspace for creating programs

### Programming Modes

#### Visual Programming
Perfect for beginners and educational settings:
- **Drag-and-drop interface** using ReactFlow
- **Pre-built blocks** for common robot actions
- **Real-time code generation** - see the Python code as you build
- **Error prevention** - blocks connect only in valid ways

#### Python Mode
For advanced users and complex programs:
- **Full Python editor** with syntax highlighting
- **Direct hardware access** through safe interfaces
- **Real-time execution** on the robot
- **Debugging support** with error messages

#### Hybrid Mode
Combines both approaches:
- **Visual blocks** for structure
- **Python code** for complex logic
- **Seamless switching** between modes
- **Educational progression** from visual to text

### Robot Management

#### Adding Robots
1. Click "Add New Robot" in the robot selection screen
2. Enter the robot's network details:
   - **IP Address**: Find this in the robot's network settings
   - **Port**: Usually 8765 (WebSocket port)
   - **Name**: Auto-generated from IP address
3. Test the connection before saving

#### Connection Status
- **Green indicator**: Robot is connected and ready
- **Gray indicator**: Robot is configured but not connected
- **Red indicator**: Connection failed or robot is unavailable

#### Multi-Robot Support
- Connect to multiple robots simultaneously
- Switch between robots in the programming interface
- Broadcast commands to all connected robots

## Common Operations

### Basic Movement
```python
# Move forward
motors.set_speed(50, 50)

# Turn right
motors.set_speed(50, -50)

# Stop
motors.stop()
```

### Sensor Reading
```python
# Read proximity sensors
proximity = sensors.get_proximity()

# Read light sensors
light = sensors.get_light()

# Read accelerometer
accel = sensors.get_accelerometer()

# Read magnetometer
magnetic = sensors.get_magnetometer()

# Read gyroscope
gyro = sensors.get_gyroscope()
```

### LED Control
```python
# Set body LED to red
leds.set_body_led(255, 0, 0)

# Blink pattern
leds.set_color("blue", "blink")
```

### Audio Feedback
```python
# Play a beep
audio.play_beep()

# Play a melody
audio.play_melody()
```

## Educational Workflows

### For Beginners (Ages 8-12)
1. Start with **Visual Programming mode**
2. Use simple movement blocks
3. Explore cause-and-effect with sensors
4. Build simple obstacle avoidance programs
5. Gradually introduce loops and conditions

### For Intermediate Users (Ages 13-17)
1. Begin with **Visual Programming**, transition to **Hybrid mode**
2. Learn programming concepts through blocks
3. Introduce Python syntax gradually
4. Build more complex behaviors
5. Explore robotics concepts like odometry and mapping

### For Advanced Users (Adults/University)
1. Use **Python mode** for maximum flexibility
2. Implement advanced algorithms
3. Integrate with external libraries
4. Develop research applications
5. Contribute to the open-source project

## Tips for Success

### Getting the Best Experience
1. **Stable Network**: Ensure both robot and computer have stable WiFi
2. **Robot Placement**: Start on a clear, flat surface
3. **Battery Level**: Keep the robot charged for consistent performance
4. **Lighting**: Good lighting helps with camera-based features
5. **Safety**: Always supervise robot operation, especially with beginners

### Troubleshooting Quick Fixes
- **Connection Issues**: Check IP address and network connectivity
- **Slow Response**: Robot battery may be low, or network is congested
- **Unexpected Behavior**: Reset the robot and restart the application
- **Code Errors**: Use the error messages to identify and fix issues

### Learning Resources
- **Built-in Examples**: Use the example programs as starting points
- **Documentation**: Refer to the comprehensive documentation in the `docs/` folder
- **Community**: Connect with other users and educators
- **Support**: Check the troubleshooting guide for common issues

## Next Steps

Once you're comfortable with the basics:

1. **Explore Advanced Features**:
   - Multi-robot coordination
   - Custom block creation
   - Python library integration
   - Data logging and analysis

2. **Educational Integration**:
   - Develop lesson plans
   - Create assignments and challenges
   - Assess student progress
   - Share resources with colleagues

3. **Community Contribution**:
   - Report bugs and suggest features
   - Contribute new blocks or examples
   - Share educational resources
   - Help other users in forums

4. **Technical Deep-Dive**:
   - Study the Clean Architecture implementation
   - Explore the WebSocket protocol
   - Understand the security model
   - Contribute to development

## Additional Resources

- **[Installation Guide](./installation.md)** - Detailed setup instructions
- **[User Guide](./user-guide.md)** - Comprehensive feature documentation
- **[API Reference](../client/api-reference.md)** - Technical API documentation
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions
- **[Development Guide](./development.md)** - Contributing to the project

Welcome to the world of educational robotics with PuckLab! Start exploring and have fun learning.
