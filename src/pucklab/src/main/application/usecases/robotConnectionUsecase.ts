import type { Robot } from '../../../domain/robot';
import { Result, Success, Failure } from '../../../domain/result';
import type { RobotCommunicationService } from '../interfaces/robotCommunicationService';

export class RobotConnectionUseCase {
  constructor(private robotRepository: RobotCommunicationService) {}

  async connectToRobot(robot: Robot): Promise<Result<Robot>> {
    try {
      if (!robot.isValid()) {
        throw new Error('Invalid robot connection parameters');
      }

      const connectedRobot = await this.robotRepository.connect(robot);
      return Success(connectedRobot);
    } catch (error) {
      return Failure(
        error instanceof Error ? error.message : 'Failed to connect to robot'
      );
    }
  }

  async disconnectFromRobot(robot: Robot): Promise<Result<Robot>> {
    try {
      if (!this.robotRepository.isConnected(robot)) {
        throw new Error('Robot is not connected');
      }

      const disconnectedRobot = await this.robotRepository.disconnect(robot);
      return Success(disconnectedRobot);
    } catch (error) {
      return Failure(
        error instanceof Error
          ? error.message
          : 'Failed to disconnect from robot'
      );
    }
  }

  async checkConnection(robot: Robot): Promise<Result<boolean>> {
    try {
      if (!robot.isValid()) {
        return Success(false);
      }

      const isConnected = await this.robotRepository.isConnected(robot);
      if (isConnected) {
        return Success(true);
      }

      const connectedRobot = await this.robotRepository.connect(robot);
      if (connectedRobot) {
        await this.robotRepository.disconnect(connectedRobot);
        return Success(true);
      }
      return Success(false);
    } catch (_error) {
      return Success(false);
    }
  }
}
