import type { Robot } from '../../../domain/robot';
import type {
  RobotFeedback,
  RobotFeedbackCallback,
} from '../../../domain/robotFeedback';
import type { Logger } from '../../../main/application/interfaces/logger';
import type { RobotCommunicationService } from '../../application/interfaces/robotCommunicationService';

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

  constructor(private logger: Logger) {}

  async connect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);

    this.logger.info('Mock robot connection attempt', {
      robotId: robot.id,
      ipAddress: robot.ipAddress,
      port: robot.port,
    });

    this.sendFeedback({
      robotId: robot.id,
      timestamp: Date.now(),
      type: 'info',
      message: 'Connecting to robot...',
    });

    await this.delay(this.simulatedDelay);

    this.connectedRobots.add(robotKey);

    this.sendFeedback({
      robotId: robot.id,
      timestamp: Date.now(),
      type: 'success',
      message: 'Robot connected successfully',
    });

    this.startPeriodicFeedback(robot);

    this.logger.info('Mock robot connection successful', { robotId: robot.id });
    return robot;
  }

  async disconnect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);

    this.logger.info('Mock robot disconnection started', { robotId: robot.id });

    this.sendFeedback({
      robotId: robot.id,
      timestamp: Date.now(),
      type: 'info',
      message: 'Disconnecting from robot...',
    });

    await this.delay(this.simulatedDelay);

    this.connectedRobots.delete(robotKey);

    this.stopPeriodicFeedback(robot);

    this.sendFeedback({
      robotId: robot.id,
      timestamp: Date.now(),
      type: 'info',
      message: 'Robot disconnected',
    });

    this.logger.info('Mock robot disconnection completed', {
      robotId: robot.id,
    });
    return robot;
  }

  async isConnected(robot: Robot): Promise<boolean> {
    const robotKey = this.getRobotKey(robot);
    const connected = this.connectedRobots.has(robotKey);

    this.logger.debug('Mock robot connection status checked', {
      robotId: robot.id,
      connected,
    });
    return connected;
  }

  async sendCommand(robot: Robot, command: string): Promise<unknown> {
    const robotKey = this.getRobotKey(robot);

    if (!this.connectedRobots.has(robotKey)) {
      throw new Error(`[MOCK] Robot ${robot.id} is not connected`);
    }

    this.logger.info('Mock robot command sent', {
      robotId: robot.id,
      command: command.substring(0, 100),
    });

    await this.delay(this.simulatedDelay);

    const mockResponse = this.generateMockResponse(command);

    this.logger.debug('Mock robot command response', {
      robotId: robot.id,
      response: mockResponse,
    });

    return mockResponse;
  }

  private getRobotKey(robot: Robot): string {
    return robot.id;
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

  subscribeToFeedback(robot: Robot, callback: RobotFeedbackCallback): void {
    const robotKey = this.getRobotKey(robot);
    this.feedbackCallbacks.set(robotKey, callback);
    this.logger.info('Mock robot feedback subscription started', {
      robotId: robot.id,
    });
  }

  unsubscribeFromFeedback(robot: Robot): void {
    const robotKey = this.getRobotKey(robot);
    this.feedbackCallbacks.delete(robotKey);
    this.stopPeriodicFeedback(robot);
    this.logger.info('Mock robot feedback subscription stopped', {
      robotId: robot.id,
    });
  }

  sendFeedback(feedback: RobotFeedback): void {
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

    this.stopPeriodicFeedback(robot);

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
    return robotKey.replace(':', '_').replace('.', '_');
  }

  private generateRandomSensorData(): unknown {
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
