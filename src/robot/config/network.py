"""Network configuration utilities for robot server"""

import socket
import logging
from typing import Optional


def get_robot_ip() -> Optional[str]:
    """Automatically detect the robot's IP address on 192.168.1.xxx network
    
    Returns:
        The robot's IP address if found, None otherwise
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Get all network interfaces
        hostname = socket.gethostname()
        logger.debug(f"🔍 Checking hostname: {hostname}")
        
        # Get IP addresses for this host
        ip_addresses = socket.gethostbyname_ex(hostname)[2]
        
        # Look for 192.168.1.xxx addresses first
        for ip in ip_addresses:
            if ip.startswith("192.168.1."):
                logger.info(f"🎯 Found robot IP on 192.168.1.x network: {ip}")
                return ip
        
        # Fallback: look for any private network IP
        for ip in ip_addresses:
            if (ip.startswith("192.168.") or 
                ip.startswith("10.") or 
                ip.startswith("172.")):
                logger.info(f"🎯 Found private network IP: {ip}")
                return ip
        
        # If no private IPs found, try connecting to a remote address
        # to determine which interface would be used
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            # Connect to a remote address (doesn't actually send data)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            if local_ip.startswith("192.168.1."):
                logger.info(f"🎯 Detected robot IP via route test: {local_ip}")
                return local_ip
        
    except Exception as e:
        logger.warning(f"⚠️  Could not auto-detect IP address: {e}")
    
    return None


def get_default_host() -> str:
    """Get the default host address for the robot server
    
    Returns:
        Robot's IP address if detected, otherwise "0.0.0.0"
    """
    robot_ip = get_robot_ip()
    if robot_ip:
        return robot_ip
    
    # Fallback to listen on all interfaces
    logging.getLogger(__name__).info("🌐 Using 0.0.0.0 (all interfaces)")
    return "0.0.0.0"


def validate_ip_address(ip: str) -> bool:
    """Validate if a string is a valid IP address
    
    Args:
        ip: IP address string to validate
        
    Returns:
        True if valid IP address, False otherwise
    """
    try:
        socket.inet_aton(ip)
        return True
    except socket.error:
        return False