import type { Robot } from '../../../domain/robot';
import type {
  RobotCommunicationService,
  RobotFeedback,
  RobotFeedbackCallback,
} from '../../application/interfaces/robotCommunicationService';

/**
 * Mock implementation of RobotCommunicationService for development mode.
 * Simulates robot connections without requiring actual hardware.
 */
export class MockRobotCommunicationService
  implements RobotCommunicationService
{
  private connectedRobots: Set<string> = new Set();
  private readonly simulatedDelay = 500; // 500ms simulation delay
  private feedbackCallbacks: Map<string, RobotFeedbackCallback> = new Map();
  private feedbackIntervals: Map<string, NodeJS.Timeout> = new Map();

  async connect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);

    console.log(
      `🤖 [MOCK] Attempting to connect to robot ${robot.id} at ${robot.ipAddress}:${robot.port}`
    );

    // Send initial feedback
    this.sendFeedback({
      robotId: robot.id,
      timestamp: Date.now(),
      type: 'info',
      message: 'Connecting to robot...',
    });

    // Simulate connection delay
    await this.delay(this.simulatedDelay);

    // Always succeed in development mode
    this.connectedRobots.add(robotKey);

    // Send success feedback
    this.sendFeedback({
      robotId: robot.id,
      timestamp: Date.now(),
      type: 'success',
      message: 'Robot connected successfully',
    });

    // Start periodic status updates
    this.startPeriodicFeedback(robot);

    console.log(`✅ [MOCK] Successfully connected to robot ${robot.id}`);
    return robot;
  }

  async disconnect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);

    console.log(`🔌 [MOCK] Disconnecting from robot ${robot.id}`);

    // Send disconnection feedback
    this.sendFeedback({
      robotId: robot.id,
      timestamp: Date.now(),
      type: 'info',
      message: 'Disconnecting from robot...',
    });

    // Simulate disconnection delay
    await this.delay(this.simulatedDelay);

    this.connectedRobots.delete(robotKey);

    // Stop periodic feedback
    this.stopPeriodicFeedback(robot);

    // Send final feedback
    this.sendFeedback({
      robotId: robot.id,
      timestamp: Date.now(),
      type: 'info',
      message: 'Robot disconnected',
    });

    console.log(`👋 [MOCK] Disconnected from robot ${robot.id}`);
    return robot;
  }

  async isConnected(robot: Robot): Promise<boolean> {
    const robotKey = this.getRobotKey(robot);
    const connected = this.connectedRobots.has(robotKey);

    console.log(
      `🔍 [MOCK] Checking connection for robot ${robot.id}: ${connected ? 'connected' : 'disconnected'}`
    );
    return connected;
  }

  async sendCommand(robot: Robot, command: string): Promise<unknown> {
    const robotKey = this.getRobotKey(robot);

    if (!this.connectedRobots.has(robotKey)) {
      throw new Error(`[MOCK] Robot ${robot.id} is not connected`);
    }

    console.log(`📤 [MOCK] Sending command to robot ${robot.id}: ${command}`);

    // Simulate command processing delay
    await this.delay(this.simulatedDelay);

    // Mock successful response based on command type
    const mockResponse = this.generateMockResponse(command);

    console.log(`📥 [MOCK] Response from robot ${robot.id}:`, mockResponse);
    return mockResponse;
  }

  private getRobotKey(robot: Robot): string {
    return `${robot.ipAddress}:${robot.port}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockResponse(command: string): unknown {
    const responses: Record<string, unknown> = {
      get_status: {
        status: 'running',
        battery: 85,
        sensors: {
          proximity: [0, 0, 0, 0, 0, 0, 0, 0],
          light: [500, 500, 500, 500, 500, 500, 500, 500],
        },
      },
      move_forward: {
        action: 'move_forward',
        status: 'executing',
        duration: 1000,
      },
      move_backward: {
        action: 'move_backward',
        status: 'executing',
        duration: 1000,
      },
      turn_left: {
        action: 'turn_left',
        status: 'executing',
        angle: 90,
      },
      turn_right: {
        action: 'turn_right',
        status: 'executing',
        angle: 90,
      },
      stop: {
        action: 'stop',
        status: 'stopped',
      },
      get_sensors: {
        proximity: [150, 0, 0, 0, 0, 0, 0, 200],
        light: [400, 600, 500, 450, 520, 480, 550, 470],
        accelerometer: { x: 0.1, y: -0.2, z: 9.8 },
      },
    };

    return (
      responses[command.toLowerCase()] || {
        command,
        status: 'executed',
        message: 'Mock command executed successfully',
      }
    );
  }

  // New feedback methods
  subscribeToFeedback(robot: Robot, callback: RobotFeedbackCallback): void {
    const robotKey = this.getRobotKey(robot);
    this.feedbackCallbacks.set(robotKey, callback);
    console.log(`📻 [MOCK] Subscribed to feedback for robot ${robot.id}`);
  }

  unsubscribeFromFeedback(robot: Robot): void {
    const robotKey = this.getRobotKey(robot);
    this.feedbackCallbacks.delete(robotKey);
    this.stopPeriodicFeedback(robot);
    console.log(`📻 [MOCK] Unsubscribed from feedback for robot ${robot.id}`);
  }

  sendFeedback(feedback: RobotFeedback): void {
    // Find callback by robotId
    for (const [robotKey, callback] of this.feedbackCallbacks.entries()) {
      if (
        robotKey.includes(feedback.robotId) ||
        this.getRobotIdFromKey(robotKey) === feedback.robotId
      ) {
        callback(feedback);
        break;
      }
    }
  }

  private startPeriodicFeedback(robot: Robot): void {
    const robotKey = this.getRobotKey(robot);

    // Clear existing interval if any
    this.stopPeriodicFeedback(robot);

    // Send periodic status updates every 3 seconds
    const interval = setInterval(() => {
      if (this.connectedRobots.has(robotKey)) {
        const statusMessages = [
          'Robot status: operational',
          'Sensors: all functional',
          'Battery level: 85%',
          'Memory usage: 45%',
          'WiFi signal: strong',
          'Ready for commands',
        ];

        const randomMessage =
          statusMessages[Math.floor(Math.random() * statusMessages.length)];

        this.sendFeedback({
          robotId: robot.id,
          timestamp: Date.now(),
          type: 'info',
          message: randomMessage,
          data: {
            battery: 85,
            sensors: this.generateRandomSensorData(),
            uptime: Math.floor(Math.random() * 3600),
          },
        });
      }
    }, 3000);

    this.feedbackIntervals.set(robotKey, interval);
  }

  private stopPeriodicFeedback(robot: Robot): void {
    const robotKey = this.getRobotKey(robot);
    const interval = this.feedbackIntervals.get(robotKey);

    if (interval) {
      clearInterval(interval);
      this.feedbackIntervals.delete(robotKey);
    }
  }

  private getRobotIdFromKey(robotKey: string): string {
    // Extract robot ID from IP:port format - this is a simple approach
    // In a real implementation, you'd maintain a proper mapping
    return robotKey.replace(':', '_').replace('.', '_');
  }

  private generateRandomSensorData(): any {
    return {
      proximity: Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 1000)
      ),
      light: Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000)),
      accelerometer: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: 9.8 + (Math.random() - 0.5) * 0.5,
      },
    };
  }
}
