export interface RobotFeedback {
  robotId: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: unknown;
}

export type RobotFeedbackCallback = (feedback: RobotFeedback) => void;