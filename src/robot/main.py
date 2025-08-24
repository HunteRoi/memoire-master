#!/usr/bin/env python3

import asyncio
import logging
import os
import signal
import sys

from presentation.epuck2_server import EPuck2Server

log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def main():
    """Main entry point"""
    host = os.getenv('ROBOT_HOST', '0.0.0.0')
    port = int(os.getenv('ROBOT_PORT', '8765'))

    server = EPuck2Server(host, port)
    shutdown_event = asyncio.Event()

    def signal_handler():
        logging.info("📡 Received shutdown signal")
        shutdown_event.set()

    # Register signal handlers
    if sys.platform != "win32":
        loop = asyncio.get_event_loop()
        for sig in [signal.SIGTERM, signal.SIGINT]:
            loop.add_signal_handler(sig, signal_handler)

    try:
        server_task = asyncio.create_task(server.start_server())
        await shutdown_event.wait()
        await server.stop_server()
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass

        logging.info("📡 Server shutdown complete")

    except KeyboardInterrupt:
        logging.info("📡 Server stopped by user")
        await server.stop_server()
    except Exception as e:
        logging.error(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
