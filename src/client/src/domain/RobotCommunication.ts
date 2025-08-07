import { WebSocket } from 'ws';

import type { Robot } from './robot';
import type { RobotFeedback, RobotFeedbackCallback } from './RobotFeedback';

export interface ConnectedRobot {
  robot: Robot;
  websocket: WebSocket;
  connected: boolean;
  lastPing: number;
  feedbackCallback?: RobotFeedbackCallback;
}

export interface RobotMessage {
  type: 'command' | 'ping' | 'status';
  data: unknown;
  timestamp: number;
}

export interface RobotResponse {
  type: 'success' | 'error' | 'status' | 'pong';
  data?: unknown;
  message?: string;
  timestamp: number;
}
