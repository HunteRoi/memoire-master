import { Failure, type Result, Success } from '../../../domain/result';
import { Robot, type RobotConfig } from '../../../domain/robot';
import type { RobotFeedback, RobotFeedbackCallback } from '../../../domain/RobotFeedback';
import type { RobotCommunicationService } from '../interfaces/robotCommunicationService';

export class RobotConnectionUseCase {
  constructor(private robotRepository: RobotCommunicationService) {}

  async connectToRobot(robot: RobotConfig): Promise<Result<RobotConfig>> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot || !bot.isValid()) {
        throw new Error('Invalid robot connection parameters');
      }

      const connectedRobot = await this.robotRepository.connect(bot);
      return Success(connectedRobot);
    } catch (error) {
      return Failure(
        error instanceof Error ? error.message : 'Failed to connect to robot'
      );
    }
  }

  async disconnectFromRobot(robot: RobotConfig): Promise<Result<RobotConfig>> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!this.robotRepository.isConnected(bot)) {
        throw new Error('Robot is not connected');
      }

      const disconnectedRobot = await this.robotRepository.disconnect(bot);
      return Success(disconnectedRobot);
    } catch (error) {
      return Failure(
        error instanceof Error
          ? error.message
          : 'Failed to disconnect from robot'
      );
    }
  }

  async checkConnection(robot: RobotConfig): Promise<Result<boolean>> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot.isValid()) {
        throw new Error('The robot data is not valid');
      }

      const isConnected = await this.robotRepository.isConnected(bot);
      if (isConnected) {
        return Success(true);
      }

      const connectedRobot = await this.robotRepository.connect(bot);
      if (connectedRobot) {
        await this.robotRepository.disconnect(connectedRobot);
        return Success(true);
      }
      throw new Error('Could not connect to robot');
    } catch (error) {
      return Failure(
        error instanceof Error
          ? error.message
          : 'Failed to check connection with robot'
      );
    }
  }

  async subscribeToFeedback(
    robot: RobotConfig,
    callback: RobotFeedbackCallback
  ): Promise<Result<boolean>> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot.isValid()) {
        throw new Error('Invalid robot connection parameters');
      }

      this.robotRepository.subscribeToFeedback(bot, callback);
      return Success(true);
    } catch (error) {
      return Failure(
        error instanceof Error
          ? error.message
          : 'Failed to subscribe to robot feedback'
      );
    }
  }

  async unsubscribeFromFeedback(robot: RobotConfig): Promise<Result<boolean>> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot.isValid()) {
        throw new Error('Invalid robot connection parameters');
      }

      this.robotRepository.unsubscribeFromFeedback(bot);
      return Success(true);
    } catch (error) {
      return Failure(
        error instanceof Error
          ? error.message
          : 'Failed to unsubscribe from robot feedback'
      );
    }
  }

  async sendCommand(
    robot: RobotConfig,
    command: string
  ): Promise<Result<unknown>> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot.isValid()) {
        throw new Error('Invalid robot connection parameters');
      }

      const result = await this.robotRepository.sendCommand(bot, command);
      return Success(result);
    } catch (error) {
      return Failure(
        error instanceof Error
          ? error.message
          : 'Failed to send command to robot'
      );
    }
  }

  sendFeedback(feedback: RobotFeedback): void {
    this.robotRepository.sendFeedback(feedback);
  }
}
