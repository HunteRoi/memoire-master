import { Robot } from '../../domain/entities/Robot';

export interface RobotCommunicationService {
  save(robot: Robot): Promise<void>;

  connect(robot: Robot): Promise<Robot>;
  disconnect(robot: Robot): Promise<Robot>;
  isConnected(robot: Robot): Promise<boolean>;

  sendCommand(robot: Robot, command: string): Promise<void>;
}
