import type {
  Robot,
  RobotFeedback,
  RobotFeedbackCallback,
} from '../../../domain/robot';

export interface RobotCommunicationService {
  connect(robot: Robot): Promise<Robot>;
  disconnect(robot: Robot): Promise<Robot>;
  isConnected(robot: Robot): Promise<boolean>;
  sendCommand(robot: Robot, command: string): Promise<unknown>;
  subscribeToFeedback(robot: Robot, callback: RobotFeedbackCallback): void;
  unsubscribeFromFeedback(robot: Robot): void;
  sendFeedback(feedback: RobotFeedback): void;
}
