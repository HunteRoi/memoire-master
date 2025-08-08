# Frequently Asked Questions (FAQ)

## General Questions

### What is PuckLab?

PuckLab is an educational interface designed to control E-Puck2 robots at UNamur. It combines visual programming concepts with advanced Python tooling to simplify robotics education and development.

### What age groups is PuckLab suitable for?

PuckLab is designed for multiple age groups:
- **Children (8-12)**: Simplified visual programming interface
- **Teenagers (13-17)**: Balanced interface with programming concepts
- **Adults (18+)**: Full-featured programming environment

### What hardware do I need?

**Required**:
- E-Puck2 robot with Pi-Puck extension
- Computer running Windows, macOS, or Linux
- WiFi network for communication

**Recommended**:
- Multiple robots for advanced scenarios
- Dedicated network for reduced latency
- External camera for observation (educational use)

### Is PuckLab free to use?

Yes, PuckLab is open-source software released under the MIT License. It's free for educational, research, and personal use.

## Installation and Setup

### What are the system requirements?

**Client Application**:
- Node.js 18 or higher
- 4GB RAM minimum (8GB recommended)
- 2GB available storage
- Modern graphics card for smooth visual programming

**Robot Server**:
- E-Puck2 with Pi-Puck extension
- Python 3.9 or higher
- 1GB RAM on Pi-Puck
- WiFi connectivity

### How do I install PuckLab?

Follow our comprehensive [Installation Guide](./installation.md) for step-by-step instructions for your platform.

### Can I run PuckLab on Raspberry Pi?

The client application requires significant resources and is designed for desktop/laptop computers. The robot server component runs on the Pi-Puck extension of the E-Puck2.

### How do I update PuckLab?

**Development Version**:
```bash
git pull origin develop
cd src/client && npm install
cd ../robot && pip install -r requirements.txt
```

**Production Version**: Download the latest installer from the releases page.

## Programming and Usage

### Which programming mode should I start with?

- **Beginners**: Start with Visual Programming mode
- **Some Programming Experience**: Try Hybrid mode
- **Experienced Programmers**: Use Python mode directly

### Can I save and share my programs?

Yes, PuckLab allows you to:
- Save programs locally as files
- Export programs for sharing with others
- Import programs created by others
- Organize programs in folders with descriptions

### How many robots can I control simultaneously?

PuckLab supports multiple robot connections. The practical limit depends on:
- Network bandwidth and latency
- Computer processing power
- Complexity of programs being executed

Most users can successfully control 5-10 robots simultaneously.

### Can I use external Python libraries?

The robot server runs in a controlled environment for security. Only approved libraries and functions are available. This includes:
- Basic Python built-ins (math, time, etc.)
- Robot hardware interfaces (motors, sensors, LEDs)
- Safe utility functions

### How do I debug my programs?

PuckLab provides several debugging tools:
- **Console Output**: View print statements and error messages
- **Step-by-step Execution**: Run programs one command at a time
- **Variable Inspection**: Monitor variable values during execution
- **Error Highlighting**: Automatic error detection and reporting

## Technical Questions

### What communication protocol does PuckLab use?

PuckLab uses a custom WebSocket-based protocol over TCP port 8765. The protocol includes:
- JSON message format
- Automatic timestamping
- Heartbeat/keepalive mechanism
- Error handling and recovery

### How secure is remote code execution?

The robot server implements multiple security layers:
- **Sandboxed Execution**: Python code runs in a controlled environment
- **Whitelist Approach**: Only approved functions are available
- **Resource Limits**: Prevention of infinite loops and resource exhaustion
- **Input Validation**: All commands are validated before execution

### Can I extend PuckLab with custom functionality?

Yes, PuckLab is designed to be extensible:
- **Custom Blocks**: Add new visual programming blocks
- **Hardware Extensions**: Support additional E-Puck2 hardware
- **Protocol Extensions**: Extend the WebSocket communication protocol
- **UI Customization**: Modify the user interface

See our [Development Guide](./development.md) for details.

### What network ports does PuckLab use?

- **WebSocket Communication**: Port 8765 (robot server)
- **Development Server**: Port 3000 (client development)
- **Electron Debug**: Various ports for development tools

Ensure these ports are not blocked by firewalls.

## Educational Use

### Is PuckLab suitable for classroom use?

Yes, PuckLab is specifically designed for educational environments:
- Age-appropriate interfaces
- Curriculum integration support
- Multi-student classroom scenarios
- Assessment and progress tracking capabilities

### How do I integrate PuckLab into my curriculum?

PuckLab can support multiple subjects:
- **Computer Science**: Programming concepts, algorithms, debugging
- **Mathematics**: Geometry, measurement, coordinate systems
- **Science**: Physics, sensors, data collection and analysis
- **Engineering**: Problem-solving, design thinking, iteration

### Can students work collaboratively?

While the current version focuses on individual programming, collaborative features include:
- Program sharing and importing
- Group problem-solving with multiple robots
- Peer code review and discussion
- Classroom demonstrations with shared screens

### How do I assess student progress?

Assessment strategies include:
- **Project-based Assessment**: Evaluate completed robot programs
- **Problem-solving Approach**: Observe debugging and iteration processes
- **Technical Skills**: Test programming concept understanding
- **Collaboration**: Assess teamwork in group activities

## Troubleshooting

### My robot won't connect. What should I check?

Common connection issues:
1. **Network Connectivity**: Ensure both devices are on the same network
2. **IP Address**: Verify the robot's IP address is correct
3. **Server Status**: Check if the robot server is running
4. **Firewall**: Ensure port 8765 is not blocked
5. **Hardware**: Verify Pi-Puck is properly connected to E-Puck2

### The visual programming interface is slow. How can I improve performance?

Performance optimization tips:
- **Close Unused Applications**: Free up system resources
- **Simplify Programs**: Break complex programs into smaller parts
- **Update Graphics Drivers**: Ensure optimal rendering performance
- **Increase RAM**: Consider upgrading to 8GB+ if using 4GB
- **Use Wired Network**: Reduce wireless network latency

### Python code isn't working. What are common mistakes?

Common Python programming errors:
- **Indentation**: Python requires consistent indentation
- **Syntax**: Missing colons, parentheses, or quotes
- **Variable Names**: Using undefined variables
- **Hardware Access**: Incorrect hardware function calls
- **Logic Errors**: Loops that never end or incorrect conditions

See our [Troubleshooting Guide](./troubleshooting.md) for detailed solutions.

### How do I report bugs or request features?

We welcome feedback and contributions:
1. **Check Existing Issues**: Search the GitHub repository for similar reports
2. **Create Detailed Reports**: Include system information, steps to reproduce, and expected behavior
3. **Provide Logs**: Include relevant error messages and log files
4. **Suggest Solutions**: If you have ideas for fixes or improvements

## Advanced Topics

### Can I modify the robot hardware?

The E-Puck2 with Pi-Puck extension is designed to be extensible. You can:
- Add sensors and actuators to the Pi-Puck
- Modify the robot server software to support new hardware
- Create custom blocks for new functionality
- Contribute hardware support back to the project

### How do I contribute to PuckLab development?

We welcome contributions:
1. **Read the Development Guide**: Understand the architecture and coding standards
2. **Start Small**: Begin with bug fixes or documentation improvements
3. **Follow Patterns**: Match existing code style and architectural patterns
4. **Test Thoroughly**: Include unit tests and integration tests
5. **Submit Pull Requests**: Use GitHub pull requests with clear descriptions

### Can PuckLab be used for research?

Absolutely! PuckLab's architecture supports research applications:
- **Custom Algorithms**: Implement advanced robotics algorithms
- **Data Collection**: Log sensor data and robot behaviors
- **Multi-robot Systems**: Coordinate multiple robots for swarm research
- **Educational Research**: Study programming learning and robotics education

### What's the roadmap for future development?

Planned features include:
- **Enhanced Visual Programming**: More block types and better visual flow
- **Simulation Mode**: Test programs without physical robots
- **Cloud Integration**: Share programs and collaborate online
- **Advanced Analytics**: Detailed program execution analysis
- **Mobile Support**: Control robots from tablets and smartphones

## Getting Help

### Where can I find more documentation?

Comprehensive documentation is available:
- **User Guide**: Complete feature documentation
- **Installation Guide**: Step-by-step setup instructions
- **API Reference**: Technical documentation for developers
- **Architecture Guide**: System design and patterns
- **Development Guide**: Contributing and extending PuckLab

### How do I get support?

Support options include:
- **Documentation**: Start with the guides in the `docs/` folder
- **Troubleshooting Guide**: Systematic problem-solving approaches
- **GitHub Issues**: Report bugs and request features
- **Community Forums**: Connect with other users and educators
- **Educational Support**: Specialized support for classroom deployments

### Can I get training for my institution?

Yes, we provide educational support:
- **Teacher Training**: Workshops on using PuckLab in classrooms
- **Curriculum Development**: Help integrating PuckLab into existing programs
- **Technical Support**: Setup and maintenance for institutional deployments
- **Custom Development**: Specialized features for specific educational needs

This FAQ covers the most common questions about PuckLab. If you can't find the answer you're looking for, please check our comprehensive documentation or reach out through our support channels.