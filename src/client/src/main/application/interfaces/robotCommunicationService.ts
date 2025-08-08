import type { Robot } from '../../../domain/robot';
import type {
  RobotFeedback,
  RobotFeedbackCallback,
} from '../../../domain/robotFeedback';

export interface RobotCommunicationService {
  connect(robot: Robot): Promise<Robot>;
  disconnect(robot: Robot): Promise<Robot>;
  isConnected(robot: Robot): Promise<boolean>;
  sendCommand(robot: Robot, command: string): Promise<unknown>;
  subscribeToFeedback(robot: Robot, callback: RobotFeedbackCallback): void;
  unsubscribeFromFeedback(robot: Robot): void;
  sendFeedback(feedback: RobotFeedback): void;
}
