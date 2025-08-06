import type { Robot } from '../../../domain/robot';
import type { RobotCommunicationService } from '../../application/interfaces/robotCommunicationService';

/**
 * Mock implementation of RobotCommunicationService for development mode.
 * Simulates robot connections without requiring actual hardware.
 */
export class MockRobotCommunicationService implements RobotCommunicationService {
  private connectedRobots: Set<string> = new Set();
  private readonly simulatedDelay = 500; // 500ms simulation delay

  async connect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);

    console.log(`🤖 [MOCK] Attempting to connect to robot ${robot.id} at ${robot.ipAddress}:${robot.port}`);

    // Simulate connection delay
    await this.delay(this.simulatedDelay);

    // Always succeed in development mode
    this.connectedRobots.add(robotKey);

    console.log(`✅ [MOCK] Successfully connected to robot ${robot.id}`);
    return robot;
  }

  async disconnect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);

    console.log(`🔌 [MOCK] Disconnecting from robot ${robot.id}`);

    // Simulate disconnection delay
    await this.delay(this.simulatedDelay);

    this.connectedRobots.delete(robotKey);

    console.log(`👋 [MOCK] Disconnected from robot ${robot.id}`);
    return robot;
  }

  async isConnected(robot: Robot): Promise<boolean> {
    const robotKey = this.getRobotKey(robot);
    const connected = this.connectedRobots.has(robotKey);

    console.log(`🔍 [MOCK] Checking connection for robot ${robot.id}: ${connected ? 'connected' : 'disconnected'}`);
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
      'get_status': {
        status: 'running',
        battery: 85,
        sensors: {
          proximity: [0, 0, 0, 0, 0, 0, 0, 0],
          light: [500, 500, 500, 500, 500, 500, 500, 500]
        }
      },
      'move_forward': {
        action: 'move_forward',
        status: 'executing',
        duration: 1000
      },
      'move_backward': {
        action: 'move_backward',
        status: 'executing',
        duration: 1000
      },
      'turn_left': {
        action: 'turn_left',
        status: 'executing',
        angle: 90
      },
      'turn_right': {
        action: 'turn_right',
        status: 'executing',
        angle: 90
      },
      'stop': {
        action: 'stop',
        status: 'stopped'
      },
      'get_sensors': {
        proximity: [150, 0, 0, 0, 0, 0, 0, 200],
        light: [400, 600, 500, 450, 520, 480, 550, 470],
        accelerometer: { x: 0.1, y: -0.2, z: 9.8 }
      }
    };

    return responses[command.toLowerCase()] || {
      command,
      status: 'executed',
      message: 'Mock command executed successfully'
    };
  }
}
