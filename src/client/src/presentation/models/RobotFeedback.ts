export interface RobotFeedback {
  robotId: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: unknown;
}

export interface ConsoleMessage {
  timestamp: number;
  type: string;
  message: string;
}

export interface RobotData {
  id: string;
  ipAddress: string;
  port: number;
}