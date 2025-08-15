# Deployment Guide for Pi Zero W

## Quick Setup

1. **Copy files to Pi Zero W:**
   ```bash
   scp -r robot/ pi@192.168.0.121:~/
   ```

2. **Install dependencies:**
   ```bash
   ssh pi@192.168.0.121
   cd ~/robot
   make install
   ```

3. **Run the server:**
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

**Manual configuration:**
```bash
python2.7 start_server.py --host 192.168.0.121 --port 8765 --log-level INFO
```

**Environment variables:**
```bash
export ROBOT_HOST=192.168.0.121
export ROBOT_PORT=8765
export LOG_LEVEL=DEBUG
python2.7 start_server.py
```

## Testing

1. **Test WebSocket connection:**
   ```bash
   python2.7 test_socket.py
   ```

2. **From Electron client:**
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

## Troubleshooting

- **Import errors**: Ensure all __init__.py files are present
- **Permission errors**: Use `sudo pip2.7 install` if needed
- **Connection issues**: Check firewall and IP address
- **Library missing**: Install with `sudo apt install python-dev` if compilation fails