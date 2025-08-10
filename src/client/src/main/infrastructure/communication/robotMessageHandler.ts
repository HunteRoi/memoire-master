import WebSocket from 'ws';

import type {
  ConnectedRobot,
  RobotMessage,
  RobotResponse,
} from '../../../domain/robot';
import type {
  RobotFeedback,
  RobotFeedbackCallback,
} from '../../../domain/robot';

export class RobotMessageHandler {
  sendMessage(ws: WebSocket, message: RobotMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  async sendCommand(
    connectedRobot: ConnectedRobot,
    command: string
  ): Promise<unknown> {
    if (!connectedRobot.connected) {
      throw new Error(`Robot ${connectedRobot.robot.id} is not connected`);
    }

    if (connectedRobot.websocket.readyState !== WebSocket.OPEN) {
      throw new Error(
        `Robot ${connectedRobot.robot.id} connection is not ready`
      );
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
        new Error(`Command timeout for robot ${connectedRobot.robot.id}`)
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

  handleRobotMessage(
    connectedRobot: ConnectedRobot,
    data: WebSocket.Data,
    onPong?: (robotId: string, timestamp: number) => void
  ): void {
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

      // Handle specific message types
      switch (response.type) {
        case 'pong':
          if (onPong) {
            onPong(connectedRobot.robot.id, Date.now());
          }
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

  sendFeedback(
    connectedRobots: Map<string, ConnectedRobot>,
    feedback: RobotFeedback
  ): void {
    // Find the robot by ID and send feedback if callback exists
    for (const connectedRobot of connectedRobots.values()) {
      if (
        connectedRobot.robot.id === feedback.robotId &&
        connectedRobot.feedbackCallback
      ) {
        connectedRobot.feedbackCallback(feedback);
        break;
      }
    }
  }

  subscribeToFeedback(
    connectedRobot: ConnectedRobot,
    callback: RobotFeedbackCallback
  ): void {
    connectedRobot.feedbackCallback = callback;
    console.log(
      `📻 [WebSocket] Subscribed to feedback for robot ${connectedRobot.robot.id}`
    );

    // Send initial connection feedback
    callback({
      robotId: connectedRobot.robot.id,
      timestamp: Date.now(),
      type: 'success',
      message: 'Real-time feedback connection established',
    });
  }

  unsubscribeFromFeedback(connectedRobot: ConnectedRobot): void {
    connectedRobot.feedbackCallback = undefined;
    console.log(
      `📻 [WebSocket] Unsubscribed from feedback for robot ${connectedRobot.robot.id}`
    );
  }

  async dispose(): Promise<void> {
    // Clean up any resources if needed
    console.log('RobotMessageHandler disposed');
  }
}
