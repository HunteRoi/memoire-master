# Installation Guide

This guide provides step-by-step instructions for setting up the PuckLab development environment and deploying the application.

## System Requirements

### Client Application
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 2GB free space

### Robot Server
- **Hardware**: E-Puck2 robot with Pi-Puck extension
- **Operating System**: Raspberry Pi OS (Debian-based)
- **Python**: Version 3.9 or higher
- **Memory**: Minimum 1GB RAM on Pi-Puck
- **Network**: WiFi connection to same network as client

## Client Application Setup

### Prerequisites Installation

#### Windows
1. **Install Node.js**:
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version (18.x or higher)
   - Run the installer and follow the setup wizard
   - Verify installation: Open Command Prompt and run `node --version`

2. **Install Git** (if not already installed):
   - Download from [git-scm.com](https://git-scm.com/)
   - Run the installer with default options

#### macOS
1. **Install Node.js**:
   - Using Homebrew: `brew install node@18`
   - Or download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Install Xcode Command Line Tools**:
   - Run: `xcode-select --install`

#### Linux (Ubuntu/Debian)
1. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install build dependencies**:
   ```bash
   sudo apt-get install -y build-essential
   ```

### Client Application Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd memoire-master/src/client
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   This will install all required packages including:
   - React 19 and related libraries
   - TypeScript compiler and types
   - Electron framework
   - Material-UI components
   - Development tools (Biome.js, Webpack)

3. **Verify Installation**:
   ```bash
   npm run typecheck
   npm run lint
   ```

4. **Start Development Server**:
   ```bash
   npm start
   ```
   This will start the Electron application in development mode with hot reload.

## Robot Server Setup

### Pi-Puck Preparation

1. **Install Raspberry Pi OS**:
   - Use Raspberry Pi Imager to flash the latest Pi OS Lite to SD card
   - Enable SSH and configure WiFi during imaging process
   - Boot the Pi-Puck and connect via SSH

2. **System Update**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo reboot
   ```

3. **Install Python Dependencies**:
   ```bash
   sudo apt install -y python3-pip python3-venv python3-dev
   sudo apt install -y libasound2-dev portaudio19-dev
   ```

4. **Install Pi-Puck Libraries**:
   ```bash
   pip3 install pi-puck unifr-api-epuck
   ```

### Robot Server Installation

1. **Transfer Server Code**:
   ```bash
   # From your development machine
   scp -r src/robot pi@<robot-ip>:~/pucklab-server
   ```

2. **Create Virtual Environment**:
   ```bash
   # On the Pi-Puck
   cd ~/pucklab-server
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Test Installation**:
   ```bash
   python main.py
   ```
   You should see startup logs indicating successful hardware initialization.

## Network Configuration

### Robot Network Setup

1. **Configure Static IP** (recommended):
   Edit `/etc/dhcpcd.conf` on the Pi-Puck:
   ```
   interface wlan0
   static ip_address=192.168.1.100/24
   static routers=192.168.1.1
   static domain_name_servers=192.168.1.1 8.8.8.8
   ```

2. **Configure Hostname**:
   ```bash
   sudo hostnamectl set-hostname pucklab-robot-01
   ```

3. **Restart Networking**:
   ```bash
   sudo systemctl restart dhcpcd
   ```

### Client Configuration

The client will automatically discover robots on the local network, but you can manually configure robot connections:

1. **Robot Configuration File**:
   Located at `src/client/src/public/robots.json`
   Contains default robot configurations that are loaded on first startup

2. **Manual Robot Addition**:
   Use the application interface to add robots by IP address and port

## Development Environment

### IDE Configuration

#### VS Code (Recommended)
1. **Install Extensions**:
   - TypeScript and JavaScript Language Features
   - React Extension Pack
   - Python Extension Pack
   - Biome.js extension

2. **Workspace Configuration**:
   Create `.vscode/settings.json`:
   ```json
   {
     "typescript.preferences.importModuleSpecifier": "relative",
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "biomejs.biome"
   }
   ```

### Git Configuration

1. **Set up Git Hooks** (optional):
   ```bash
   # In the client directory
   npx simple-git-hooks
   ```

2. **Configure Git Ignore**:
   The repository includes comprehensive `.gitignore` files for both client and robot components.

## Production Deployment

### Client Application

1. **Build for Production**:
   ```bash
   cd src/client
   npm run make
   ```
   This creates platform-specific installers in the `out/make/` directory.

2. **Distribution**:
   - Windows: `.exe` installer
   - macOS: `.dmg` disk image  
   - Linux: `.deb` and `.rpm` packages

### Robot Server

1. **Create Production Configuration**:
   Create `config/production.py` with production-specific settings.

2. **Set up System Service**:
   Create `/etc/systemd/system/pucklab-robot.service`:
   ```ini
   [Unit]
   Description=PuckLab Robot Server
   After=network.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/pucklab-server
   Environment=PYTHONPATH=/home/pi/pucklab-server
   ExecStart=/home/pi/pucklab-server/venv/bin/python main.py
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable Service**:
   ```bash
   sudo systemctl enable pucklab-robot.service
   sudo systemctl start pucklab-robot.service
   ```

## Verification and Testing

### Client Verification
1. **Application Startup**: The application should start without errors
2. **Robot Discovery**: The robot selection page should show available robots
3. **Connection Test**: Should be able to connect to configured robots
4. **Visual Programming**: Drag-and-drop interface should be functional

### Robot Server Verification
1. **Service Status**: `sudo systemctl status pucklab-robot.service`
2. **Network Connectivity**: WebSocket server should accept connections on port 8765
3. **Hardware Response**: LEDs should indicate current state
4. **Command Execution**: Python commands should execute successfully

## Troubleshooting

### Common Issues

#### Client Won't Start
- **Node Version**: Ensure Node.js 18+ is installed
- **Dependencies**: Run `npm install` again
- **Permissions**: Check file permissions in project directory

#### Robot Connection Failed
- **Network**: Verify client and robot are on same network
- **Firewall**: Ensure port 8765 is not blocked
- **Service Status**: Check if robot server service is running

#### Hardware Not Responding
- **Pi-Puck Connection**: Ensure proper connection between Pi and E-Puck2
- **Permissions**: Robot server may need hardware access permissions
- **Hardware Test**: Run individual hardware component tests

### Getting Help

1. **Check Logs**:
   - Client logs: Available in developer tools console
   - Robot logs: `/var/log/pucklab-robot.log` or `journalctl -u pucklab-robot.service`

2. **Documentation**: Refer to component-specific documentation in the `docs/` directory

3. **System Information**: Gather system information for troubleshooting:
   - Operating system version
   - Node.js and Python versions
   - Network configuration
   - Hardware specifications

This installation guide should get you up and running with PuckLab in both development and production environments.