#!/usr/bin/env python3

import argparse
import asyncio
import logging
import os
import signal
import sys
import time

from presentation.epuck2_server import EPuck2Server
from infrastructure.hardware.epuck2 import EPuck2

log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def run_diagnostics():
    """Run hardware diagnostic tests"""
    logging.info("🔧 Starting EPuck2 diagnostic tests...")

    try:
        # Initialize EPuck2 directly for testing
        epuck = EPuck2()

        logging.info("\n" + "="*50)
        logging.info("🚗 Test 1: Motor Movement Test (Format 2)")
        logging.info("="*50)
        
        logging.info("🚀 Testing FORWARD movement...")
        epuck.set_motor_speeds(200, 200)
        time.sleep(2)
        epuck.set_motor_speeds(0, 0)
        time.sleep(1)
        
        logging.info("⬅️ Testing BACKWARD movement...")
        epuck.set_motor_speeds(-200, -200)  
        time.sleep(2)
        epuck.set_motor_speeds(0, 0)
        time.sleep(1)
        
        logging.info("↩️ Testing LEFT turn...")
        epuck.set_motor_speeds(-200, 200)
        time.sleep(1.5)
        epuck.set_motor_speeds(0, 0)
        time.sleep(1)
        
        logging.info("↪️ Testing RIGHT turn...")
        epuck.set_motor_speeds(200, -200)
        time.sleep(1.5)
        epuck.set_motor_speeds(0, 0)
        
        logging.info("✅ Motor movement test completed!")
        comm_success = True

        logging.info("\n" + "="*50)
        logging.info("🔊 Test 2: Audio Test")
        logging.info("="*50)
        audio_success = epuck.test_sound_patterns()

        logging.info("\n" + "="*50)
        logging.info("💡 Test 3: LED Test (Pi-puck + e-puck2)")
        logging.info("="*50)

        # Test both e-puck2 body LEDs and simulate Pi-puck LEDs
        logging.info("🔴 Testing RED LEDs...")
        logging.info("🔴 - e-puck2 body LEDs: RED")
        epuck.set_body_led_rgb(255, 0, 0)  # e-puck2 body LEDs
        logging.info("🔴 - Pi-puck LEDs: Would be ON (simulated - need actual Pi-puck hardware)")
        time.sleep(1)

        logging.info("🟢 Testing GREEN LEDs...")
        logging.info("🟢 - e-puck2 body LEDs: GREEN")
        epuck.set_body_led_rgb(0, 255, 0)  # e-puck2 body LEDs
        logging.info("🟢 - Pi-puck LEDs: Would be ON (simulated - need actual Pi-puck hardware)")
        time.sleep(1)

        logging.info("🔵 Testing BLUE LEDs...")
        logging.info("🔵 - e-puck2 body LEDs: BLUE")
        epuck.set_body_led_rgb(0, 0, 255)  # e-puck2 body LEDs
        logging.info("🔵 - Pi-puck LEDs: Would be ON (simulated - need actual Pi-puck hardware)")
        time.sleep(1)

        logging.info("⚪ Testing WHITE LEDs...")
        logging.info("⚪ - e-puck2 body LEDs: WHITE")
        epuck.set_body_led_rgb(255, 255, 255)  # e-puck2 body LEDs
        logging.info("⚪ - Pi-puck LEDs: Would be ON (simulated - need actual Pi-puck hardware)")
        time.sleep(1)

        logging.info("🌈 Testing All LEDs Off...")
        logging.info("🌈 - e-puck2 body LEDs: OFF")
        epuck.set_all_leds_off()  # e-puck2 LEDs off
        logging.info("🌈 - Pi-puck LEDs: Would be OFF (simulated - need actual Pi-puck hardware)")
        time.sleep(1)

        logging.info("💡 Testing Front LED (e-puck2)...")
        epuck.set_front_led(True)
        time.sleep(1)
        epuck.set_front_led(False)

        logging.info("\n" + "="*50)
        logging.info("💡 Test 3b: Pi-puck LED Hardware Test (separate from e-puck2)")
        logging.info("="*50)
        logging.info("⏸️ Waiting 2 seconds before Pi-puck LED test...")
        time.sleep(2)
        pipuck_led_success = epuck.test_pipuck_leds()

        # Summary
        logging.info("\n" + "="*50)
        logging.info("📊 DIAGNOSTIC SUMMARY")
        logging.info("="*50)
        logging.info(f"📡 I2C Communication: {'✅ PASS' if comm_success else '❌ FAIL'}")
        logging.info(f"🔊 Audio System: {'✅ PASS' if audio_success else '❌ FAIL'}")
        logging.info("💡 e-puck2 Body LEDs: ✅ PASS (if you saw RGB changes)")
        logging.info(f"💡 Pi-puck LEDs: {'✅ PASS' if pipuck_led_success else '⚠️ NEEDS HARDWARE SETUP'}")

        # Cleanup
        epuck.close()

        logging.info("🔧 Diagnostic tests completed!")
        return comm_success and audio_success and pipuck_led_success

    except Exception as e:
        logging.error(f"❌ Diagnostic test failed: {e}")
        return False

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='EPuck2 Robot Server')
    parser.add_argument('--test', action='store_true',
                       help='Run hardware diagnostic tests instead of starting server')
    parser.add_argument('--test-i2c', action='store_true',
                       help='Run I2C communication test only')
    parser.add_argument('--test-audio', action='store_true',
                       help='Run audio test only')
    parser.add_argument('--scan-i2c', action='store_true',
                       help='Scan for I2C devices only')

    args = parser.parse_args()

    # Handle diagnostic tests
    if args.test:
        success = await run_diagnostics()
        sys.exit(0 if success else 1)

    elif args.test_i2c:
        logging.info("📡 Running I2C communication test...")
        try:
            epuck = EPuck2()
            success = epuck.test_i2c_communication()
            epuck.close()
            logging.info(f"📡 I2C Test: {'✅ PASS' if success else '❌ FAIL'}")
            sys.exit(0 if success else 1)
        except Exception as e:
            logging.error(f"❌ I2C test failed: {e}")
            sys.exit(1)

    elif args.test_audio:
        logging.info("🔊 Running audio test...")
        try:
            epuck = EPuck2()
            success = epuck.test_audio()
            epuck.close()
            logging.info(f"🔊 Audio Test: {'✅ PASS' if success else '❌ FAIL'}")
            sys.exit(0 if success else 1)
        except Exception as e:
            logging.error(f"❌ Audio test failed: {e}")
            sys.exit(1)

    elif args.scan_i2c:
        logging.info("🔍 Scanning I2C devices...")
        try:
            epuck = EPuck2()
            epuck.scan_i2c_addresses()
            epuck.close()
            sys.exit(0)
        except Exception as e:
            logging.error(f"❌ I2C scan failed: {e}")
            sys.exit(1)

    # Normal server mode
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
