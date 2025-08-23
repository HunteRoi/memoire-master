import type {
  ConnectedRobot,
  Robot,
  RobotFeedback,
  RobotFeedbackCallback,
} from '../../../domain/robot';
import type { Logger } from '../../../main/application/interfaces/logger';
import type { Disposable } from '../../application/interfaces';
import type { RobotCommunicationService } from '../../application/interfaces/robotCommunicationService';
import { RobotConnectionManager } from './robotConnectionManager';
import { RobotHealthMonitor } from './robotHealthMonitor';
import { RobotMessageHandler } from './robotMessageHandler';

export class WebsocketRobotCommunicationService
  implements RobotCommunicationService, Disposable {
  private connectionManager: RobotConnectionManager;
  private messageHandler: RobotMessageHandler;
  private healthMonitor: RobotHealthMonitor;
  private disposed = false;

  constructor(private logger: Logger) {
    this.connectionManager = new RobotConnectionManager(logger);
    this.messageHandler = new RobotMessageHandler();
    this.healthMonitor = new RobotHealthMonitor(this.messageHandler, logger);
  }

  async connect(robot: Robot): Promise<Robot> {
    const result = await this.connectionManager.connect(robot);

    const connectedRobot = this.connectionManager.getConnectedRobot(robot);
    if (connectedRobot) {
      connectedRobot.websocket.onmessage = event => {
        this.messageHandler.handleRobotMessage(
          connectedRobot,
          event.data,
          (robotId: string, timestamp: number) => {
            this.healthMonitor.updateLastPing(
              this.connectionManager
                .getAllConnectedRobots()
                .reduce((map, cr) => {
                  map.set(this.getRobotKey(cr.robot), cr);
                  return map;
                }, new Map<string, ConnectedRobot>()),
              robotId,
              timestamp
            );
          }
        );
      };

      this.messageHandler.sendMessage(connectedRobot.websocket, {
        type: 'status',
        data: { status: 'connected', client: 'pucklab' },
        timestamp: Date.now(),
      });

      const allConnectedRobots = this.connectionManager.getAllConnectedRobots();
      if (allConnectedRobots.length === 1) {
        this.healthMonitor.startMonitoring(
          allConnectedRobots.reduce((map, cr) => {
            map.set(this.getRobotKey(cr.robot), cr);
            return map;
          }, new Map<string, ConnectedRobot>())
        );
      }
    }

    return result;
  }

  async disconnect(robot: Robot): Promise<Robot> {
    const connectedRobot = this.connectionManager.getConnectedRobot(robot);

    if (connectedRobot) {
      this.messageHandler.sendMessage(connectedRobot.websocket, {
        type: 'status',
        data: { status: 'disconnecting' },
        timestamp: Date.now(),
      });
    }

    const result = await this.connectionManager.disconnect(robot);

    const allConnectedRobots = this.connectionManager.getAllConnectedRobots();
    if (allConnectedRobots.length === 0) {
      this.healthMonitor.stopMonitoring();
    }

    return result;
  }

  async isConnected(robot: Robot): Promise<boolean> {
    return this.connectionManager.isConnected(robot);
  }

  async sendCommand(robot: Robot, command: string): Promise<unknown> {
    const connectedRobot = this.connectionManager.getConnectedRobot(robot);

    if (!connectedRobot) {
      throw new Error(`Robot ${robot.id} is not connected`);
    }

    return this.messageHandler.sendCommand(connectedRobot, command);
  }

  private getRobotKey(robot: Robot): string {
    return `${robot.ipAddress}:${robot.port}`;
  }

  /**
   * Dispose method for proper resource cleanup
   * Implements Disposable interface
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.disposed = true;

    this.healthMonitor.stopMonitoring();

    await this.connectionManager.dispose();

    if (
      'dispose' in this.messageHandler &&
      typeof this.messageHandler.dispose === 'function'
    ) {
      await this.messageHandler.dispose();
    }

    if (
      'dispose' in this.healthMonitor &&
      typeof this.healthMonitor.dispose === 'function'
    ) {
      await this.healthMonitor.dispose();
    }
  }

  subscribeToFeedback(robot: Robot, callback: RobotFeedbackCallback): void {
    const connectedRobot = this.connectionManager.getConnectedRobot(robot);

    if (connectedRobot) {
      this.messageHandler.subscribeToFeedback(connectedRobot, callback);
    } else {
      this.logger.warn(
        `📻 [WebSocket] Robot ${robot.id} not connected, cannot subscribe to feedback`
      );
    }
  }

  unsubscribeFromFeedback(robot: Robot): void {
    const connectedRobot = this.connectionManager.getConnectedRobot(robot);

    if (connectedRobot) {
      this.messageHandler.unsubscribeFromFeedback(connectedRobot);
    }
  }

  sendFeedback(feedback: RobotFeedback): void {
    const connectedRobotsMap = this.connectionManager
      .getAllConnectedRobots()
      .reduce((map, cr) => {
        map.set(this.getRobotKey(cr.robot), cr);
        return map;
      }, new Map<string, ConnectedRobot>());

    this.messageHandler.sendFeedback(connectedRobotsMap, feedback);
  }

  setDisconnectCallback(callback: (robotId: string) => void): void {
    this.connectionManager.setDisconnectCallback(callback);
  }
}
