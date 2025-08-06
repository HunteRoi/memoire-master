#!/usr/bin/env python3
"""Simple startup script for the e-puck2 robot server"""

import os
import sys
import argparse
from pathlib import Path

# Add the robot directory to Python path
robot_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(robot_dir))

from main import main
import asyncio


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="E-puck2 Robot WebSocket Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment Variables:
  LOG_LEVEL          Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
  LOG_FILE           Log file path (default: logs/robot_server.log)
  LOG_MAX_BYTES      Maximum log file size in bytes (default: 10485760)
  LOG_BACKUP_COUNT   Number of backup log files (default: 5)
  ROBOT_HOST         Server host address (default: 0.0.0.0)
  ROBOT_PORT         Server port (default: 8765)

Examples:
  python start_server.py
  LOG_LEVEL=DEBUG python start_server.py
  ROBOT_PORT=9000 python start_server.py
        """
    )

    parser.add_argument(
        "--host",
        default=os.getenv("ROBOT_HOST"),  # Will be auto-detected if not set
        help="Server host address (default: auto-detect robot IP)"
    )

    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("ROBOT_PORT", "8765")),
        help="Server port (default: 8765)"
    )

    parser.add_argument(
        "--log-level",
        default=os.getenv("LOG_LEVEL", "INFO"),
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Logging level (default: INFO)"
    )

    parser.add_argument(
        "--version",
        action="version",
        version="E-puck2 Robot Server v1.0.0"
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    # Auto-detect robot IP if not specified
    if not args.host:
        from config.network import get_default_host
        args.host = get_default_host()

    # Set environment variables from command line args
    os.environ["ROBOT_HOST"] = args.host
    os.environ["ROBOT_PORT"] = str(args.port)
    os.environ["LOG_LEVEL"] = args.log_level

    print("🤖 Starting E-puck2 Robot Server...")
    print(f"📡 Server will listen on ws://{args.host}:{args.port}/robot")
    print(f"📝 Log level: {args.log_level}")
    print("Press Ctrl+C to stop the server\n")

    try:
        # Run the main server
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)
