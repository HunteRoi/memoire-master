import { Robot, RobotStatus } from '../../domain/entities/Robot';
import { RobotCommunicationService } from '../../application/services/RobotCommunicationService';
import { SerializedRobot } from '../types/SerializedRobot';

export class WebSocketRobotCommunicationService implements RobotCommunicationService {
  private connections: Map<string, WebSocket> = new Map();

  async save(robot: Robot): Promise<void> {
    const stored = localStorage.getItem('connectedRobots');
    const robots = stored ? JSON.parse(stored) : [];

    const index = robots.findIndex((r: any) => r.id === robot.id);
    if (index >= 0) {
      robots[index] = this.robotToStorage(robot);
    } else {
      robots.push(this.robotToStorage(robot));
    }

    localStorage.setItem('connectedRobots', JSON.stringify(robots));
  }

  async connect(robot: Robot): Promise<Robot> {
    const websocketUrl = `ws://${robot.connection.ipAddress}:${robot.connection.port}`;

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(websocketUrl);

        ws.onopen = () => {
          this.connections.set(robot.id, ws);
          const connectedRobot = robot.updateStatus(RobotStatus.CONNECTED);
          resolve(connectedRobot);
        };

        ws.onclose = () => {
          this.connections.delete(robot.id);
        };

        ws.onerror = (error) => {
          this.connections.delete(robot.id);
          reject(new Error(`Failed to connect to robot ${robot.id}: ${error}`));
        };

        ws.onmessage = (event) => {
          console.log(`Message from robot ${robot.id}:`, event.data);
        };

        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            reject(new Error(`Connection timeout for robot ${robot.id}`));
          }
        }, 10000);

      } catch (error) {
        reject(new Error(`Failed to create WebSocket connection: ${error}`));
      }
    });
  }

  async disconnect(robot: Robot): Promise<Robot> {
    const ws = this.connections.get(robot.id);
    if (ws) {
      ws.close();
      this.connections.delete(robot.id);
    }

    return robot.updateStatus(RobotStatus.DISCONNECTED);
  }

  async isConnected(robot: Robot): Promise<boolean> {
    const ws = this.connections.get(robot.id);
    return ws?.readyState === WebSocket.OPEN;
  }

  async sendCommand(robot: Robot, command: string): Promise<void> {
    const ws = this.connections.get(robot.id);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Robot ${robot.id} is not connected`);
    }

    return new Promise((resolve, reject) => {
      try {
        ws.send(command);
        resolve();
      } catch (error) {
        reject(new Error(`Failed to send command to robot ${robot.id}: ${error}`));
      }
    });
  }

  private robotToStorage(robot: Robot): SerializedRobot {
    return {
      ipAddress: robot.connection.ipAddress,
      port: robot.connection.port
    };
  }
}
