# Deployment Guide for Pi Zero W

## Quick Setup

1. **Copy files to Pi Zero W:**
   ```bash
   scp -r robot/ pi@192.168.0.121:~/
   ```

2. **Check system compatibility:**
   ```bash
   ssh pi@192.168.0.121
   cd ~/robot
   chmod +x check_system.sh
   ./check_system.sh    # Checks hardware, Python versions, offers Python 3 install
   ```

3. **Setup and run:**
   ```bash
   make setup     # Install dependencies and create config
   nano .env      # Edit your settings (optional)
   make run       # Start the robot server
   ```

   **Or with debug logging:**
   ```bash
   make debug
   ```

## Requirements

- **Python 3.11+** (install with `sudo apt install python3 python3-pip python3-venv`)
- **Hardware libraries**: RPi.GPIO, gpiozero (will install automatically)
- **Optional**: unifr-api-epuck, pi-puck (for advanced e-puck2 features)

## Configuration

The server auto-detects the robot's IP address on 192.168.0.xxx network.

**Configuration priority (highest to lowest):**
1. Command line arguments
2. Environment variables
3. .env file
4. Default values

**Method 1 - .env file (recommended):**
```bash
cp .env.example .env
# Edit .env file with your settings
make run
```

**Method 2 - Command line arguments:**
```bash
ROBOT_HOST=192.168.0.121 ROBOT_PORT=8765 LOG_LEVEL=INFO python3 main.py
```

**Method 3 - Environment variables:**
```bash
export ROBOT_HOST=192.168.0.121
export ROBOT_PORT=8765
export LOG_LEVEL=DEBUG
python3 main.py
```

## File Structure

```
robot/
├── main.py            # Python 3 WebSocket server
├── requirements.txt   # Python 3 dependencies
├── Makefile          # Build/run commands with venv support
├── .env.example      # Configuration template
├── .env              # Your configuration (created by make config)
├── venv/             # Virtual environment (created by make venv)
├── check_system.sh   # System compatibility checker
├── application/      # Business logic
├── config/          # Configuration utilities
├── domain/          # Core entities and interfaces
└── infrastructure/  # Hardware implementations
```

## Available Makefile Commands

```bash
make help         # Show all available commands
make setup        # Complete setup (venv + install + config)
make venv         # Create virtual environment only
make install      # Install Python dependencies in venv
make config       # Create .env file from .env.example
make config-force # Create .env file (overwrites existing)
make run          # Start the robot server (in venv)
make run-debug    # Start server with debug logging (in venv)
make clean        # Remove generated files
make clean-all    # Remove everything including venv
make lint         # Basic syntax checking (in venv)
```

## Troubleshooting

- **Import errors**: Ensure all __init__.py files are present
- **Python 3.11+ missing**: Install with `sudo apt install python3 python3-pip python3-venv`
- **Permission errors**: Virtual environment should prevent this
- **Connection issues**: Check firewall and IP address
- **Library missing**: Install with `sudo apt install python3-dev` if compilation fails
- **.env not working**: Run `make config` to create .env from .env.example
- **Clean start**: Run `make clean-all && make setup` for fresh installation
