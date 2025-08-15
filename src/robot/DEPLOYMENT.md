# Deployment Guide for Pi Zero W

## Quick Setup

1. **Copy files to Pi Zero W:**
   ```bash
   scp -r robot/ pi@192.168.0.121:~/
   ```

2. **Install dependencies and setup:**
   ```bash
   ssh pi@192.168.0.121
   cd ~/robot
   make install
   make config    # Creates .env file from .env.example
   ```

3. **Customize configuration (optional):**
   ```bash
   nano .env      # Edit your settings
   ```

4. **Run the server:**
   ```bash
   make run
   # Or with debug logging:
   make debug
   ```

## Requirements

- **Python 2.7** (pre-installed on most Pi Zero W systems)
- **pip for Python 2.7**: `sudo apt install python-pip` if not available
- **Hardware libraries**: unifr-api-epuck, pi-puck (will install via pip)

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
python2.7 start_server.py
```

**Method 2 - Command line arguments:**
```bash
python2.7 start_server.py --host 192.168.0.121 --port 8765 --log-level INFO
```

**Method 3 - Environment variables:**
```bash
export ROBOT_HOST=192.168.0.121
export ROBOT_PORT=8765
export LOG_LEVEL=DEBUG
python2.7 start_server.py
```

## Testing

1. **Test .env file loading:**
   ```bash
   python2.7 test_env.py
   ```

2. **Test WebSocket connection:**
   ```bash
   python2.7 test_socket.py
   ```

3. **From Electron client:**
   - Connect to `ws://192.168.0.121:8765`
   - Should receive status message immediately
   - Can send ping/command messages

## File Structure

```
robot/
├── main.py              # Main server entry point
├── start_server.py      # Startup script with argument parsing
├── websocket_server.py  # Custom WebSocket implementation for Python 2.7
├── requirements.txt     # Python 2.7 compatible dependencies
├── Makefile            # Simple build/run commands
├── test_socket.py      # WebSocket test client
├── application/        # Business logic
├── config/            # Configuration utilities
├── domain/            # Core entities and interfaces
└── infrastructure/    # Hardware implementations
```

## Available Makefile Commands

```bash
make help         # Show all available commands
make install      # Install Python dependencies  
make config       # Create .env file from .env.example
make config-force # Create .env file (overwrites existing)
make run          # Start the robot server
make debug        # Start server with debug logging
make clean        # Remove generated files
make lint         # Basic syntax checking
```

## Troubleshooting

- **Import errors**: Ensure all __init__.py files are present
- **Permission errors**: Use `sudo pip2.7 install` if needed
- **Connection issues**: Check firewall and IP address
- **Library missing**: Install with `sudo apt install python-dev` if compilation fails
- **.env not working**: Run `make config` to create .env from .env.example