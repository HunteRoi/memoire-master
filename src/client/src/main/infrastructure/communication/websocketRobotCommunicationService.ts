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
  implements RobotCommunicationService, Disposable
{
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

    // Setup message handling for the connected robot
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

      // Send initial status message
      this.messageHandler.sendMessage(connectedRobot.websocket, {
        type: 'status',
        data: { status: 'connected', client: 'pucklab' },
        timestamp: Date.now(),
      });

      // Start health monitoring if this is the first connected robot
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
      // Send disconnecting status message
      this.messageHandler.sendMessage(connectedRobot.websocket, {
        type: 'status',
        data: { status: 'disconnecting' },
        timestamp: Date.now(),
      });
    }

    const result = await this.connectionManager.disconnect(robot);

    // Stop health monitoring if no robots are connected
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

    // Stop health monitoring first
    this.healthMonitor.stopMonitoring();

    // Dispose connection manager (which handles robot disconnections)
    await this.connectionManager.dispose();

    // Clean up message handler if it has disposal logic
    if (
      'dispose' in this.messageHandler &&
      typeof this.messageHandler.dispose === 'function'
    ) {
      await this.messageHandler.dispose();
    }

    // Clean up health monitor if it has disposal logic
    if (
      'dispose' in this.healthMonitor &&
      typeof this.healthMonitor.dispose === 'function'
    ) {
      await this.healthMonitor.dispose();
    }
  }

  /**
   * Legacy cleanup method for backward compatibility
   * @deprecated Use dispose() instead
   */
  public cleanup(): void {
    this.dispose().catch(error => {
      this.logger.error('Error during service cleanup:', error);
    });
  }

  // Feedback methods implementation
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
}
