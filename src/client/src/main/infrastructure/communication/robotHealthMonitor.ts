import type { ConnectedRobot, RobotMessage } from '../../../domain/robot';
import type { Logger } from '../../../main/application/interfaces/logger';
import type { RobotMessageHandler } from './robotMessageHandler';

export class RobotHealthMonitor {
  private readonly pingInterval = 30000; // 30 seconds
  private pingTimer?: NodeJS.Timeout;

  constructor(
    private messageHandler: RobotMessageHandler,
    private logger: Logger
  ) {}

  startMonitoring(connectedRobots: Map<string, ConnectedRobot>): void {
    if (this.pingTimer) {
      this.stopMonitoring();
    }

    this.pingTimer = setInterval(() => {
      this.sendPingsToRobots(connectedRobots);
    }, this.pingInterval);
  }

  stopMonitoring(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
  }

  updateLastPing(
    connectedRobots: Map<string, ConnectedRobot>,
    robotId: string,
    timestamp: number
  ): void {
    for (const [_key, connectedRobot] of connectedRobots.entries()) {
      if (connectedRobot.robot.id === robotId) {
        connectedRobot.lastPing = timestamp;
        break;
      }
    }
  }

  private sendPingsToRobots(
    connectedRobots: Map<string, ConnectedRobot>
  ): void {
    const now = Date.now();

    connectedRobots.forEach((connectedRobot, _robotKey) => {
      if (connectedRobot.connected) {
        const pingMessage: RobotMessage = {
          type: 'ping',
          data: {},
          timestamp: now,
        };

        this.messageHandler.sendMessage(connectedRobot.websocket, pingMessage);

        // Check for ping timeout
        if (now - connectedRobot.lastPing > this.pingInterval * 2) {
          this.logger.warn(
            `⚠️ Robot ${connectedRobot.robot.id} ping timeout, disconnecting...`
          );

          // Terminate connection asynchronously
          setTimeout(() => {
            connectedRobot.websocket.terminate();
          }, 0);
        }
      }
    });
  }

  async dispose(): Promise<void> {
    this.stopMonitoring();
    this.logger.info('RobotHealthMonitor disposed');
  }
}
