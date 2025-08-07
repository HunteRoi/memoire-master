import type { Robot } from '../../../domain/robot';

export interface RobotFeedback {
  robotId: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: unknown;
}

export type RobotFeedbackCallback = (feedback: RobotFeedback) => void;

export interface RobotCommunicationService {
  connect(robot: Robot): Promise<Robot>;
  disconnect(robot: Robot): Promise<Robot>;
  isConnected(robot: Robot): Promise<boolean>;
  sendCommand(robot: Robot, command: string): Promise<unknown>;
  subscribeToFeedback(robot: Robot, callback: RobotFeedbackCallback): void;
  unsubscribeFromFeedback(robot: Robot): void;
  sendFeedback(feedback: RobotFeedback): void;
}
