import WebSocket from 'ws';

import type {
  ConnectedRobot,
  Robot,
  RobotFeedbackCallback,
} from '../../../domain/robot';
import type { Logger } from '../../../main/application/interfaces/logger';
import type { Disposable } from '../../application/interfaces';

export class RobotConnectionManager implements Disposable {
  private connectedRobots: Map<string, ConnectedRobot> = new Map();
  private readonly connectionTimeout = 10000; // 10 seconds
  private disposed = false;
  private onRobotDisconnected?: (robotId: string) => void;

  constructor(private logger: Logger) { }

  setDisconnectCallback(callback: (robotId: string) => void): void {
    this.onRobotDisconnected = callback;
  }

  async connect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);

    if (this.connectedRobots.has(robotKey)) {
      const existing = this.connectedRobots.get(robotKey);
      if (existing?.connected) {
        return robot;
      }
    }

    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${robot.ipAddress}:${robot.port}`;
      const ws = new WebSocket(wsUrl);

      const connectionTimer = setTimeout(() => {
        ws.terminate();
        reject(new Error(`Connection timeout to robot ${robot.id}`));
      }, this.connectionTimeout);

      ws.on('open', () => {
        clearTimeout(connectionTimer);
        this.logger.info('Robot connected successfully', {
          robotId: robot.id,
          wsUrl,
        });

        const connectedRobot: ConnectedRobot = {
          robot,
          websocket: ws,
          connected: true,
          lastPing: Date.now(),
        };

        this.connectedRobots.set(robotKey, connectedRobot);
        resolve(robot);
      });

      ws.on('error', error => {
        clearTimeout(connectionTimer);
        this.logger.error(
          'WebSocket connection error',
          error instanceof Error ? error : undefined,
          { robotId: robot.id }
        );
        this.removeRobot(robotKey);
        reject(
          new Error(`Failed to connect to robot ${robot.id}: ${error.message}`)
        );
      });

      ws.on('close', () => {
        clearTimeout(connectionTimer);
        this.logger.info('WebSocket connection closed', { robotId: robot.id });
        this.removeRobot(robotKey);
      });
    });
  }

  async disconnect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);

    return new Promise(resolve => {
      if (!connectedRobot) {
        resolve(robot);
        return;
      }

      connectedRobot.websocket.close(1000, 'Client disconnect');
      this.removeRobot(robotKey);

      this.logger.info('Robot disconnected successfully', {
        robotId: robot.id,
      });
      resolve(robot);
    });
  }

  async isConnected(robot: Robot): Promise<boolean> {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);

    return (
      (connectedRobot?.connected &&
        connectedRobot.websocket.readyState === WebSocket.OPEN) ||
      false
    );
  }

  getConnectedRobot(robot: Robot): ConnectedRobot | undefined {
    const robotKey = this.getRobotKey(robot);
    return this.connectedRobots.get(robotKey);
  }

  getAllConnectedRobots(): ConnectedRobot[] {
    return Array.from(this.connectedRobots.values());
  }

  subscribeToFeedback(robot: Robot, callback: RobotFeedbackCallback): void {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);

    if (connectedRobot?.connected) {
      connectedRobot.feedbackCallback = callback;
      this.logger.info('Subscribed to robot feedback', { robotId: robot.id });
    } else {
      this.logger.warn(
        'Cannot subscribe to feedback - robot not connected',
        undefined,
        {
          robotId: robot.id,
        }
      );
    }
  }

  unsubscribeFromFeedback(robot: Robot): void {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);

    if (connectedRobot) {
      connectedRobot.feedbackCallback = undefined;
      this.logger.info('Unsubscribed from robot feedback', {
        robotId: robot.id,
      });
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.logger.info('Disposing robot connection manager', {
      connectedCount: this.connectedRobots.size,
    });

    const disconnectPromises = Array.from(this.connectedRobots.values()).map(
      async connectedRobot => {
        try {
          if (connectedRobot.websocket.readyState === WebSocket.OPEN) {
            connectedRobot.websocket.close(1000, 'Service shutting down');
            await this.waitForClose(connectedRobot.websocket, 5000);
          }
        } catch (error) {
          this.logger.warn(
            'Error during robot disconnection',
            error instanceof Error ? error : undefined,
            {
              robotId: connectedRobot.robot.id,
            }
          );

          connectedRobot.websocket.terminate();
        }
      }
    );

    await Promise.allSettled(disconnectPromises);
    this.connectedRobots.clear();

    this.logger.info('Robot connection manager disposed');
  }

  private async waitForClose(ws: WebSocket, timeoutMs: number): Promise<void> {
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve();
      }, timeoutMs);

      const onClose = () => {
        clearTimeout(timeout);
        resolve();
      };

      if ('on' in ws && typeof ws.on === 'function') {
        ws.on('close', onClose);
      } else {
        // Fallback for environments where 'on' method might not be available
        resolve();
      }
    });
  }

  private getRobotKey(robot: Robot): string {
    return `${robot.ipAddress}:${robot.port}`;
  }

  private removeRobot(robotKey: string): void {
    const connectedRobot = this.connectedRobots.get(robotKey);
    if (connectedRobot) {
      connectedRobot.connected = false;

      connectedRobot.feedbackCallback = undefined;

      this.connectedRobots.delete(robotKey);

      this.logger.debug('Robot removed from connection manager', {
        robotKey,
        remainingConnections: this.connectedRobots.size,
      });

      // Notify that robot has disconnected
      if (this.onRobotDisconnected) {
        this.onRobotDisconnected(connectedRobot.robot.id);
      }
    }
  }
}
