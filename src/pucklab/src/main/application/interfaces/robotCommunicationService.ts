import { Robot } from '../../../domain/robot';

export interface RobotCommunicationService {
  connect(robot: Robot): Promise<Robot>;
  disconnect(robot: Robot): Promise<Robot>;
  isConnected(robot: Robot): Promise<boolean>;
  sendCommand(robot: Robot, command: string): Promise<unknown>;
}
