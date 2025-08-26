# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with PuckLab.

## Quick Diagnostics

### System Check

Before troubleshooting specific issues, verify your system setup:

**Client System**:
- [ ] Node.js 18+ is installed: `node --version`
- [ ] Application dependencies are installed: `npm list` shows no errors
- [ ] Network connectivity is working: can ping robot IP address
- [ ] Sufficient disk space available (at least 1GB free)
- [ ] No antivirus software blocking the application

**Robot System**:
- [ ] Robot is powered on and responsive
- [ ] Pi-Puck is properly connected to E-Puck2
- [ ] Robot server is running: check process status
- [ ] Network connection is stable: ping test from robot
- [ ] Sufficient battery power remaining

## Connection Issues

### Cannot Connect to Robot

**Symptoms**: Robot appears offline, connection attempts fail, timeout errors

**Diagnosis Steps**:

1. **Network Connectivity Test**:
   ```bash
   # From your computer, test basic connectivity
   ping [robot-ip-address]

   # Test WebSocket port specifically
   telnet [robot-ip-address] 8765
   ```

2. **Robot Server Status**:
   ```bash
   # On the robot, check if server is running
   ps aux | grep python

   # Check server logs
   journalctl -u pucklab-robot.service -n 50
   ```

3. **Network Configuration**:
   - Verify robot and client are on the same network subnet
   - Check for firewall rules blocking port 8765
   - Confirm IP address hasn't changed (DHCP vs static)

**Solutions**:

- **Restart Robot Server**: `sudo systemctl restart pucklab-robot.service`
- **Check Network Settings**: Verify IP configuration on both devices
- **Firewall Configuration**: Allow port 8765 through firewall
- **Static IP**: Configure static IP to prevent address changes

### Intermittent Connection Drops

**Symptoms**: Connection works initially but drops during operation

**Common Causes**:
- **Weak WiFi Signal**: Robot moving out of range
- **Network Congestion**: Too many devices on network
- **Power Issues**: Low battery causing network instability
- **Interference**: Other 2.4GHz devices causing interference

**Solutions**:
- Move router closer to operating area
- Use 5GHz WiFi if available
- Reduce network traffic during robot operations
- Charge robot battery fully before use
- Check for interference from microwaves, Bluetooth devices

### Authentication/Permission Errors

**Symptoms**: "Permission denied" or "Access forbidden" messages

**Solutions**:
- Verify robot server has proper hardware permissions
- Check that WebSocket path is correct (`/robot`)
- Ensure robot server is running with appropriate user privileges
- Verify no security software is blocking connections

## Application Issues

### Client Application Won't Start

**Symptoms**: Application crashes on startup, blank window, or error messages

**Diagnosis**:

1. **Check Node.js Version**:
   ```bash
   node --version  # Should be 18.0.0 or higher
   npm --version   # Should be compatible with Node version
   ```

2. **Verify Dependencies**:
   ```bash
   cd src/client
   npm install    # Reinstall dependencies
   npm run typecheck  # Check for TypeScript errors
   ```

3. **Check System Requirements**:
   - Sufficient RAM (minimum 4GB, recommended 8GB)
   - Graphics drivers are up to date
   - Operating system is supported

**Solutions**:
- **Clean Installation**: Delete `node_modules` and run `npm install`
- **Update System**: Ensure OS and drivers are current
- **Run in Development Mode**: Use `npm start` for better error reporting
- **Check Logs**: Look in developer console for detailed error messages

### Visual Programming Interface Issues

**Symptoms**: Blocks won't connect, interface is unresponsive, or visual glitches

**Common Causes**:
- **Browser Engine Issues**: Chromium/Electron rendering problems
- **Memory Issues**: Insufficient RAM or memory leaks
- **Graphics Issues**: Hardware acceleration problems

**Solutions**:
- **Restart Application**: Close and reopen PuckLab
- **Clear Cache**: Reset application cache and preferences
- **Disable Hardware Acceleration**: Add `--disable-gpu` flag
- **Update Graphics Drivers**: Ensure latest drivers are installed

### Python Code Execution Problems

**Symptoms**: Python code doesn't run, syntax errors, or runtime exceptions

**Common Issues**:

1. **Syntax Errors**:
   - Check for missing colons, incorrect indentation
   - Verify parentheses and bracket matching
   - Look for invalid variable names

2. **Runtime Errors**:
   - Division by zero in calculations
   - Accessing undefined variables
   - Invalid hardware operations

3. **Permission Errors**:
   - Hardware access denied
   - File system permission issues

**Solutions**:
- **Use Syntax Highlighting**: Enable Python syntax highlighting to catch errors
- **Start Simple**: Test basic commands before complex programs
- **Check Error Messages**: Read console output carefully
- **Verify Hardware Access**: Ensure robot hardware is initialized properly

## Robot Hardware Issues

### Robot Doesn't Move

**Symptoms**: Commands execute without error, but robot doesn't respond physically

**Diagnosis Steps**:

1. **Test Hardware Directly**:
   ```python
   # On robot server, test motor hardware
   motors.set_speed(200, 200)
   motors.stop()
   ```

2. **Check Physical Connections**:
   - Verify Pi-Puck is properly seated on E-Puck2
   - Check that motors are not mechanically blocked
   - Ensure battery is adequately charged

3. **Verify Hardware Initialization**:
   - Check robot server logs for hardware initialization errors
   - Verify all hardware components initialized successfully

**Solutions**:
- **Restart Robot**: Power cycle the E-Puck2 robot
- **Check Connections**: Ensure all physical connections are secure
- **Test Individual Components**: Test motors, sensors individually
- **Update Firmware**: Ensure E-Puck2 firmware is current

### Sensor Readings Incorrect

**Symptoms**: Sensors return zero values, extreme values, or inconsistent readings

**Common Causes**:
- **Hardware Initialization Issues**: Sensors not properly initialized
- **Calibration Problems**: Sensors need calibration
- **Environmental Interference**: External factors affecting readings
- **Hardware Malfunction**: Sensor hardware failure

**Solutions**:
- **Restart Hardware**: Reinitialize all sensor hardware
- **Check Environment**: Test in different lighting/surface conditions
- **Calibrate Sensors**: Run sensor calibration procedures
- **Test Individual Sensors**: Isolate which sensors are problematic

### LED/Audio Not Working

**Symptoms**: LEDs don't change color, no audio output, or incorrect patterns

**Solutions**:
- **Check Volume Settings**: Ensure system volume is adequate
- **Verify Hardware**: Test LEDs and audio hardware directly
- **Check Permissions**: Ensure audio/LED hardware permissions
- **Update Drivers**: Verify Pi-Puck drivers are current

## Performance Issues

### Slow Response Times

**Symptoms**: Delays between commands and robot response, sluggish interface

**Causes and Solutions**:

1. **Network Latency**:
   - **Test Network Speed**: Use ping tests to measure latency
   - **Optimize Network**: Reduce network congestion
   - **Use Wired Connection**: If possible, use Ethernet for robot

2. **System Resource Issues**:
   - **Check CPU Usage**: Monitor system resources
   - **Close Applications**: Free up system memory
   - **Restart Services**: Restart both client and robot services

3. **Robot Hardware Limitations**:
   - **Battery Level**: Low battery can slow performance
   - **Background Processes**: Check for unnecessary processes on Pi-Puck
   - **Storage Space**: Ensure sufficient free storage

### High Memory Usage

**Symptoms**: Application becomes slow, system runs out of memory

**Solutions**:
- **Monitor Memory Usage**: Use task manager to identify memory leaks
- **Restart Application**: Regular restarts can help with memory leaks
- **Close Unused Features**: Disable features you're not using
- **Update Application**: Newer versions may have memory optimizations

## Error Messages

### Common Error Messages and Solutions

**"Robot not found at IP address"**:
- Verify robot IP address is correct
- Check that robot server is running
- Test network connectivity with ping

**"WebSocket connection failed"**:
- Ensure port 8765 is not blocked by firewall
- Check that robot server WebSocket service is active
- Verify no other service is using port 8765

**"Command execution timeout"**:
- Check robot is not stuck or blocked physically
- Verify robot has sufficient battery power
- Reduce command complexity or add delays

**"Hardware initialization failed"**:
- Restart robot and try again
- Check physical connections between Pi-Puck and E-Puck2
- Verify Pi-Puck drivers are installed correctly

**"Permission denied accessing hardware"**:
- Run robot server with appropriate privileges
- Check hardware device permissions
- Verify user is in correct groups for hardware access

## Getting Additional Help

### Log Collection

When reporting issues, collect relevant logs:

**Client Logs**:
- Open Developer Tools (F12) and check Console tab
- Look for error messages with timestamps
- Note any network request failures

**Robot Server Logs**:
```bash
# System service logs
journalctl -u pucklab-robot.service -n 100

# Application logs
tail -n 100 /var/log/pucklab-robot.log
```

### System Information

Include this information when seeking help:
- Operating system version
- Node.js and Python versions
- PuckLab version
- Robot hardware model and firmware version
- Network configuration details
- Complete error messages and stack traces

### Community Support

- **Documentation**: Check the comprehensive documentation in the `docs/` folder
- **GitHub Issues**: Search existing issues or create new ones
- **User Forums**: Connect with other PuckLab users
- **Educational Resources**: Access teaching materials and examples

### Professional Support

For institutional or classroom deployments:
- Technical support for deployment
- Training materials for educators
- Curriculum integration assistance
- Custom feature development

This troubleshooting guide covers the most common issues encountered with PuckLab. Most problems can be resolved by following these systematic approaches to diagnosis and resolution.
