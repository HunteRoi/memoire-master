"""Logging configuration for robot server"""

import logging
import logging.handlers
import os


def setup_logging(
    level="INFO",
    log_file=None,
    max_bytes=10 * 1024 * 1024,  # 10MB
    backup_count=5
):
    """Setup logging configuration for the robot server

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path
        max_bytes: Maximum size of each log file
        backup_count: Number of backup files to keep
    """

    # Convert string level to logging constant
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    # Create formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)8s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Clear existing handlers
    root_logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(numeric_level)
    root_logger.addHandler(console_handler)

    # File handler (if specified)
    if log_file:
        # Create log directory if it doesn't exist
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)

        # Rotating file handler
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(numeric_level)
        root_logger.addHandler(file_handler)

    # Reduce noise from socket library (if needed)
    # logging.getLogger("socket").setLevel(logging.WARNING)

    # Log startup message
    logger = logging.getLogger(__name__)
    logger.info("Logging configured: level=%s, file=%s" % (level, log_file))


def get_log_config():
    """Get logging configuration from environment variables"""
    return {
        "level": os.getenv("LOG_LEVEL", "INFO"),
        "log_file": os.getenv("LOG_FILE", "logs/robot_server.log"),
        "max_bytes": int(os.getenv("LOG_MAX_BYTES", "10485760")),  # 10MB
        "backup_count": int(os.getenv("LOG_BACKUP_COUNT", "5"))
    }
