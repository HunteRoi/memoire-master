import WebSocket from 'ws';

import type { Robot } from '../../../domain/robot';
import type { RobotFeedback, RobotFeedbackCallback } from '../../../domain/RobotFeedback';
import type { ConnectedRobot, RobotMessage, RobotResponse } from '../../../domain/RobotCommunication';
import type { RobotCommunicationService } from '../../application/interfaces/robotCommunicationService';

export class WebsocketRobotCommunicationService
  implements RobotCommunicationService {
  private connectedRobots: Map<string, ConnectedRobot> = new Map();
  private readonly connectionTimeout = 10000; // 10 seconds
  private readonly pingInterval = 30000; // 30 seconds
  private pingTimer: NodeJS.Timeout;


  async connect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);

    // Check if already connected
    if (this.connectedRobots.has(robotKey)) {
      const existing = this.connectedRobots.get(robotKey);
      if (existing.connected) {
        return robot;
      }
    }

    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${robot.ipAddress}:${robot.port}/robot`;
      const ws = new WebSocket(wsUrl);

      const connectionTimer = setTimeout(() => {
        ws.terminate();
        reject(new Error(`Connection timeout to robot ${robot.id}`));
      }, this.connectionTimeout);

      ws.on('open', () => {
        clearTimeout(connectionTimer);
        console.log(`✅ Connected to robot ${robot.id} at ${wsUrl}`);

        const connectedRobot: ConnectedRobot = {
          robot,
          websocket: ws,
          connected: true,
          lastPing: Date.now(),
        };

        this.connectedRobots.set(robotKey, connectedRobot);

        // Start ping timer if this is the first connected robot
        if (this.connectedRobots.size === 1) {
          this.startPingTimer();
        }

        this.sendMessage(ws, {
          type: 'status',
          data: { status: 'connected', client: 'pucklab' },
          timestamp: Date.now(),
        });

        resolve(robot);
      });

      ws.on('message', (data: WebSocket.Data) => {
        this.handleRobotMessageWithFeedback(robotKey, data);
      });

      ws.on('error', error => {
        clearTimeout(connectionTimer);
        console.error(`❌ WebSocket error for robot ${robot.id}:`, error);
        this.removeRobot(robotKey);
        reject(error);
      });

      ws.on('close', (code, reason) => {
        clearTimeout(connectionTimer);
        console.log(
          `🔌 Disconnected from robot ${robot.id}. Code: ${code}, Reason: ${reason}`
        );
        this.removeRobot(robotKey);
      });
    });
  }

  async disconnect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);

    if (!connectedRobot) {
      return robot;
    }

    return new Promise(resolve => {
      this.sendMessage(connectedRobot.websocket, {
        type: 'status',
        data: { status: 'disconnecting' },
        timestamp: Date.now(),
      });

      connectedRobot.websocket.close(1000, 'Client disconnect');
      this.removeRobot(robotKey);

      console.log(`👋 Disconnected from robot ${robot.id}`);
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

  async sendCommand(robot: Robot, command: string): Promise<unknown> {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);

    if (!connectedRobot || !connectedRobot.connected) {
      throw new Error(`Robot ${robot.id} is not connected`);
    }

    if (connectedRobot.websocket.readyState !== WebSocket.OPEN) {
      throw new Error(`Robot ${robot.id} connection is not ready`);
    }

    return new Promise((resolve, reject) => {
      const message: RobotMessage = {
        type: 'command',
        data: { command, source: 'pucklab' },
        timestamp: Date.now(),
      };

      const responseTimeout = setTimeout(
        reject,
        30000,
        new Error(`Command timeout for robot ${robot.id}`)
      );

      const originalHandler = connectedRobot.websocket.onmessage;
      connectedRobot.websocket.onmessage = event => {
        try {
          const response: RobotResponse = JSON.parse(event.data.toString());
          if (response.type === 'success' || response.type === 'error') {
            clearTimeout(responseTimeout);
            connectedRobot.websocket.onmessage = originalHandler;

            if (response.type === 'error') {
              reject(new Error(response.message || 'Robot command failed'));
            } else {
              resolve(response.data);
            }
          }
        } catch (_error) {
          if (originalHandler) originalHandler(event);
        }
      };

      this.sendMessage(connectedRobot.websocket, message);
    });
  }

  private getRobotKey(robot: Robot): string {
    return `${robot.ipAddress}:${robot.port}`;
  }

  private removeRobot(robotKey: string): void {
    const connectedRobot = this.connectedRobots.get(robotKey);
    if (connectedRobot) {
      connectedRobot.connected = false;
      this.connectedRobots.delete(robotKey);

      // Stop ping timer if no robots are connected
      if (this.connectedRobots.size === 0) {
        this.stopPingTimer();
      }
    }
  }

  private sendMessage(ws: WebSocket, message: RobotMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private startPingTimer(): void {
    this.pingTimer = setInterval(
      this.sendPingsToRobots.bind(this),
      this.pingInterval
    );
  }

  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
  }

  /**
   * Cleanup method to be called when the service is destroyed
   * Clears the ping timer and disconnects all robots
   */
  public cleanup(): void {
    this.stopPingTimer();

    // Disconnect all robots
    this.connectedRobots.forEach((connectedRobot) => {
      if (connectedRobot.websocket.readyState === WebSocket.OPEN) {
        connectedRobot.websocket.close();
      }
    });

    this.connectedRobots.clear();
  }

  private sendPingsToRobots(): void {
    const now = Date.now();

    this.connectedRobots.forEach((connectedRobot, robotKey) => {
      if (connectedRobot.connected) {
        this.sendMessage(connectedRobot.websocket, {
          type: 'ping',
          data: {},
          timestamp: now,
        });

        if (now - connectedRobot.lastPing > this.pingInterval * 2) {
          console.warn(
            `⚠️ Robot ${connectedRobot.robot.id} ping timeout, disconnecting...`
          );
          setTimeout(
            connectedRobot.websocket.terminate.bind(connectedRobot.websocket),
            0
          );
          setTimeout(this.removeRobot.bind(this), 0, robotKey);
        }
      }
    });
  }

  // Feedback methods implementation
  subscribeToFeedback(robot: Robot, callback: RobotFeedbackCallback): void {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);

    if (connectedRobot) {
      connectedRobot.feedbackCallback = callback;
      console.log(
        `📻 [WebSocket] Subscribed to feedback for robot ${robot.id}`
      );

      // Send initial connection feedback
      callback({
        robotId: robot.id,
        timestamp: Date.now(),
        type: 'success',
        message: 'Real-time feedback connection established',
      });
    } else {
      console.warn(
        `📻 [WebSocket] Robot ${robot.id} not connected, cannot subscribe to feedback`
      );
    }
  }

  unsubscribeFromFeedback(robot: Robot): void {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);

    if (connectedRobot) {
      connectedRobot.feedbackCallback = undefined;
      console.log(
        `📻 [WebSocket] Unsubscribed from feedback for robot ${robot.id}`
      );
    }
  }

  sendFeedback(feedback: RobotFeedback): void {
    // Find the robot by ID and send feedback if callback exists
    for (const connectedRobot of this.connectedRobots.values()) {
      if (
        connectedRobot.robot.id === feedback.robotId &&
        connectedRobot.feedbackCallback
      ) {
        connectedRobot.feedbackCallback(feedback);
        break;
      }
    }
  }

  // Enhanced message handling with feedback
  private handleRobotMessageWithFeedback(
    robotKey: string,
    data: WebSocket.Data
  ): void {
    const connectedRobot = this.connectedRobots.get(robotKey);
    if (!connectedRobot) return;

    try {
      const response: RobotResponse = JSON.parse(data.toString());

      // Send feedback for all message types
      const feedback: RobotFeedback = {
        robotId: connectedRobot.robot.id,
        timestamp: Date.now(),
        type: response.type === 'error' ? 'error' : 'info',
        message: this.formatRobotMessage(response),
        data: response.data,
      };

      if (connectedRobot.feedbackCallback) {
        connectedRobot.feedbackCallback(feedback);
      }

      // Original message handling logic
      switch (response.type) {
        case 'pong':
          connectedRobot.lastPing = Date.now();
          break;
        case 'status':
        case 'error':
          // Feedback already sent above
          break;
        default:
          // Handle other message types
          break;
      }
    } catch (error) {
      console.error(
        `Failed to parse message from robot ${connectedRobot.robot.id}:`,
        error
      );

      if (connectedRobot.feedbackCallback) {
        connectedRobot.feedbackCallback({
          robotId: connectedRobot.robot.id,
          timestamp: Date.now(),
          type: 'error',
          message: `Failed to parse robot message: ${error}`,
          data: { rawData: data.toString() },
        });
      }
    }
  }

  private formatRobotMessage(response: RobotResponse): string {
    switch (response.type) {
      case 'pong':
        return 'Robot responding to ping';
      case 'status':
        return `Robot status: ${JSON.stringify(response.data)}`;
      case 'error':
        return `Robot error: ${response.message || 'Unknown error'}`;
      case 'success':
        return `Robot command completed successfully`;
      default:
        return `Robot message: ${response.type}`;
    }
  }
}
