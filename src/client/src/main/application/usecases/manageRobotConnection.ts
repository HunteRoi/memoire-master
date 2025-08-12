import {
  isRobotError,
  RobotCommandError,
  RobotConnectionError,
} from '../../../domain/errors';
import { Failure, type Result, Success } from '../../../domain/result';
import type {
  RobotFeedback,
  RobotFeedbackCallback,
} from '../../../domain/robot';
import { Robot, type RobotConfig } from '../../../domain/robot';
import type { Logger } from '../interfaces/logger';
import type { RobotCommunicationService } from '../interfaces/robotCommunicationService';

export class ManageRobotConnection {
  constructor(
    private robotRepository: RobotCommunicationService,
    private logger: Logger
  ) { }

  async connectToRobot(robot: RobotConfig): Promise<Result<RobotConfig>> {
    try {
      const botResult = Robot.create()
        .setIpAddress(robot.ipAddress)
        .setPort(robot.port)
        .build();

      if (!botResult.success) {
        return Failure(botResult.error);
      }

      const bot = botResult.data;

      this.logger.info('Attempting to connect to robot', {
        robotId: bot.id,
        ipAddress: bot.ipAddress,
        port: bot.port,
      });

      const connectedRobot = await this.robotRepository.connect(bot);

      this.logger.info('Successfully connected to robot', { robotId: bot.id });
      return Success(connectedRobot);
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConnectionError(
          error instanceof Error
            ? error.message
            : 'Failed to connect to robot',
          robot.ipAddress
        );

      this.logger.warn('Failed to connect to robot', robotError, {
        robotIp: robot.ipAddress,
        port: robot.port,
      });

      return Failure(robotError.message);
    }
  }

  async disconnectFromRobot(robot: RobotConfig): Promise<Result<RobotConfig>> {
    try {
      const botResult = Robot.create()
        .setIpAddress(robot.ipAddress)
        .setPort(robot.port)
        .build();

      if (!botResult.success) {
        return Failure(botResult.error);
      }

      const bot = botResult.data;

      const isConnected = await this.robotRepository.isConnected(bot);
      if (!isConnected) {
        throw new RobotConnectionError('Robot is not connected', bot.id);
      }

      this.logger.info('Attempting to disconnect from robot', {
        robotId: bot.id,
      });

      const disconnectedRobot = await this.robotRepository.disconnect(bot);

      this.logger.info('Successfully disconnected from robot', {
        robotId: bot.id,
      });
      return Success(disconnectedRobot);
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConnectionError(
          error instanceof Error
            ? error.message
            : 'Failed to disconnect from robot',
          robot.ipAddress
        );

      this.logger.error('Failed to disconnect from robot', robotError, {
        robotIp: robot.ipAddress,
      });

      return Failure(robotError.message);
    }
  }

  async checkConnection(robot: RobotConfig): Promise<Result<boolean>> {
    try {
      const botResult = Robot.create()
        .setIpAddress(robot.ipAddress)
        .setPort(robot.port)
        .build();

      if (!botResult.success) {
        return Failure(botResult.error);
      }

      const bot = botResult.data;

      this.logger.debug('Checking robot connection', { robotId: bot.id });

      const isConnected = await this.robotRepository.isConnected(bot);
      if (isConnected) {
        this.logger.debug('Robot is already connected', { robotId: bot.id });
        return Success(true);
      }

      const connectedRobot = await this.robotRepository.connect(bot);
      if (connectedRobot) {
        await this.robotRepository.disconnect(connectedRobot);
        this.logger.debug('Robot connection test successful', {
          robotId: bot.id,
        });
        return Success(true);
      }

      throw new RobotConnectionError(
        'Could not establish test connection to robot',
        bot.id
      );
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConnectionError(
          error instanceof Error
            ? error.message
            : 'Failed to check connection with robot',
          robot.ipAddress
        );

      this.logger.error('Robot connection check failed', robotError, {
        robotIp: robot.ipAddress,
      });

      return Failure(robotError.message);
    }
  }

  async subscribeToFeedback(
    robot: RobotConfig,
    callback: RobotFeedbackCallback
  ): Promise<Result<boolean>> {
    try {
      const botResult = Robot.create()
        .setIpAddress(robot.ipAddress)
        .setPort(robot.port)
        .build();

      if (!botResult.success) {
        return Failure(botResult.error);
      }

      const bot = botResult.data;

      this.logger.info('Subscribing to robot feedback', { robotId: bot.id });

      this.robotRepository.subscribeToFeedback(bot, callback);
      return Success(true);
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConnectionError(
          error instanceof Error
            ? error.message
            : 'Failed to subscribe to robot feedback',
          robot.ipAddress
        );

      this.logger.error('Failed to subscribe to robot feedback', robotError, {
        robotIp: robot.ipAddress,
      });

      return Failure(robotError.message);
    }
  }

  async unsubscribeFromFeedback(robot: RobotConfig): Promise<Result<boolean>> {
    try {
      const botResult = Robot.create()
        .setIpAddress(robot.ipAddress)
        .setPort(robot.port)
        .build();

      if (!botResult.success) {
        return Failure(botResult.error);
      }

      const bot = botResult.data;

      this.logger.info('Unsubscribing from robot feedback', {
        robotId: bot.id,
      });

      this.robotRepository.unsubscribeFromFeedback(bot);
      return Success(true);
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConnectionError(
          error instanceof Error
            ? error.message
            : 'Failed to unsubscribe from robot feedback',
          robot.ipAddress
        );

      this.logger.error(
        'Failed to unsubscribe from robot feedback',
        robotError,
        {
          robotIp: robot.ipAddress,
        }
      );

      return Failure(robotError.message);
    }
  }

  async sendCommand(
    robot: RobotConfig,
    command: string
  ): Promise<Result<unknown>> {
    try {
      const botResult = Robot.create()
        .setIpAddress(robot.ipAddress)
        .setPort(robot.port)
        .build();

      if (!botResult.success) {
        return Failure(botResult.error);
      }

      const bot = botResult.data;

      if (!command || command.trim().length === 0) {
        throw new RobotCommandError('Command cannot be empty', command, bot.id);
      }

      this.logger.info('Sending command to robot', {
        robotId: bot.id,
        command: command.slice(0, 100),
      });

      const result = await this.robotRepository.sendCommand(bot, command);

      this.logger.info('Command sent successfully to robot', {
        robotId: bot.id,
      });
      return Success(result);
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotCommandError(
          error instanceof Error
            ? error.message
            : 'Failed to send command to robot',
          command,
          robot.ipAddress
        );

      this.logger.error('Failed to send command to robot', robotError, {
        robotIp: robot.ipAddress,
        command: command.slice(0, 50),
      });

      return Failure(robotError.message);
    }
  }

  sendFeedback(feedback: RobotFeedback): void {
    this.robotRepository.sendFeedback(feedback);
  }
}
