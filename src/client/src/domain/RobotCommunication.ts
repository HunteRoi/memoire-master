import type WebSocket from 'ws';

import type { Robot } from './robot';
import type { RobotFeedbackCallback } from './robotFeedback';

export interface ConnectedRobot {
  robot: Robot;
  websocket: WebSocket; // design decision to let external package blood into the domain layer
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
