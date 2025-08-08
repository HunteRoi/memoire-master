import { DEFAULT_ROBOT } from '../../../domain/constants';
import {
  isRobotError,
  RobotConfigurationError,
  RobotValidationError,
} from '../../../domain/errors';
import { Failure, type Result, Success } from '../../../domain/result';
import { Robot, type RobotConfig } from '../../../domain/robot';
import type { Logger } from '../interfaces/logger';
import type { RobotsConfigurationRepository } from '../interfaces/robotsConfigurationRepository';

export class ManageRobots {
  constructor(
    private robotsConfigurationRepository: RobotsConfigurationRepository,
    private logger: Logger
  ) {}

  async loadRobots(): Promise<Result<Robot[]>> {
    try {
      this.logger.debug('Loading robots configuration');
      const robots = await this.robotsConfigurationRepository.loadRobots();
      this.logger.info('Successfully loaded robots configuration', {
        count: robots.length,
      });
      return Success(robots);
    } catch (error) {
      const robotError = new RobotConfigurationError(
        error instanceof Error
          ? error.message
          : 'Failed to load robots configuration',
        'load'
      );

      this.logger.error('Failed to load robots configuration', robotError);
      return Failure(robotError.message);
    }
  }

  async addRobot(robot: RobotConfig): Promise<Result<RobotConfig[]>> {
    try {
      const botResult = Robot.create()
        .setIpAddress(robot.ipAddress)
        .setPort(robot.port)
        .build();

      if (!botResult.success) {
        return Failure(botResult.error);
      }

      const bot = botResult.data;

      this.logger.info('Attempting to add robot', {
        robotId: bot.id,
        ipAddress: bot.ipAddress,
        port: bot.port,
      });

      const exists = await this.robotsConfigurationRepository.findById(bot.id);
      if (exists) {
        throw new RobotConfigurationError(
          `Robot with ID '${bot.id}' already exists`,
          'add'
        );
      }

      await this.robotsConfigurationRepository.save(bot);
      this.logger.info('Successfully added robot', { robotId: bot.id });

      const result = await this.loadRobots();
      return result.success ? Success(result.data) : result;
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConfigurationError(
            error instanceof Error ? error.message : 'Failed to add robot',
            'add'
          );

      this.logger.error('Failed to add robot', robotError, {
        robotIp: robot.ipAddress,
        port: robot.port,
      });

      return Failure(robotError.message);
    }
  }

  async updateRobot(robot: RobotConfig): Promise<Result<RobotConfig[]>> {
    try {
      const botResult = Robot.create()
        .setIpAddress(robot.ipAddress)
        .setPort(robot.port)
        .build();

      if (!botResult.success) {
        return Failure(botResult.error);
      }

      const bot = botResult.data;

      if (!bot.id || bot.id.trim().length === 0) {
        throw new RobotValidationError(
          'Robot ID is required for update',
          'robotId'
        );
      }

      this.logger.info('Attempting to update robot', { robotId: bot.id });

      const existingRobot = await this.robotsConfigurationRepository.findById(
        bot.id
      );
      if (!existingRobot) {
        throw new RobotConfigurationError(
          `Robot with ID '${bot.id}' not found for update`,
          'update'
        );
      }

      await this.robotsConfigurationRepository.update(bot);
      this.logger.info('Successfully updated robot', { robotId: bot.id });

      const result = await this.loadRobots();
      return result.success ? Success(result.data) : result;
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConfigurationError(
            error instanceof Error ? error.message : 'Failed to update robot',
            'update'
          );

      this.logger.error('Failed to update robot', robotError, {
        robotIp: robot.ipAddress,
        port: robot.port,
      });

      return Failure(robotError.message);
    }
  }

  async removeRobot(robotId: string): Promise<Result<RobotConfig[]>> {
    try {
      if (!robotId || robotId.trim().length === 0) {
        throw new RobotValidationError(
          'Robot ID is required for removal',
          'robotId'
        );
      }

      const sanitizedRobotId = robotId.trim();

      if (sanitizedRobotId === DEFAULT_ROBOT.id) {
        throw new RobotConfigurationError(
          'Cannot remove the default robot',
          'remove'
        );
      }

      this.logger.info('Attempting to remove robot', {
        robotId: sanitizedRobotId,
      });

      const existingRobot =
        await this.robotsConfigurationRepository.findById(sanitizedRobotId);
      if (!existingRobot) {
        throw new RobotConfigurationError(
          `Robot with ID '${sanitizedRobotId}' not found for removal`,
          'remove'
        );
      }

      await this.robotsConfigurationRepository.remove(sanitizedRobotId);
      this.logger.info('Successfully removed robot', {
        robotId: sanitizedRobotId,
      });

      const result = await this.loadRobots();
      return result.success ? Success(result.data) : result;
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConfigurationError(
            error instanceof Error ? error.message : 'Failed to remove robot',
            'remove'
          );

      this.logger.error('Failed to remove robot', robotError, { robotId });

      return Failure(robotError.message);
    }
  }

  async clearRobots(): Promise<Result<RobotConfig[]>> {
    try {
      this.logger.warn('Clearing all robots configuration');

      await this.robotsConfigurationRepository.clear();
      await this.robotsConfigurationRepository.save(DEFAULT_ROBOT);

      this.logger.info(
        'Successfully cleared robots configuration and restored default robot'
      );

      const result = await this.loadRobots();
      return result.success ? Success(result.data) : result;
    } catch (error) {
      const robotError = new RobotConfigurationError(
        error instanceof Error
          ? error.message
          : 'Failed to clear robots configuration',
        'clear'
      );

      this.logger.error('Failed to clear robots configuration', robotError);
      return Failure(robotError.message);
    }
  }

  async findRobotById(robotId: string): Promise<Result<RobotConfig>> {
    try {
      if (!robotId || robotId.trim().length === 0) {
        throw new RobotValidationError(
          'Robot ID is required for search',
          'robotId'
        );
      }

      const sanitizedRobotId = robotId.trim();

      this.logger.debug('Searching for robot by ID', {
        robotId: sanitizedRobotId,
      });

      const robot =
        await this.robotsConfigurationRepository.findById(sanitizedRobotId);
      if (!robot) {
        throw new RobotConfigurationError(
          `Robot with ID '${sanitizedRobotId}' not found`,
          'find'
        );
      }

      this.logger.debug('Successfully found robot', {
        robotId: sanitizedRobotId,
      });
      return Success(robot);
    } catch (error) {
      const robotError = isRobotError(error)
        ? error
        : new RobotConfigurationError(
            error instanceof Error ? error.message : 'Failed to find robot',
            'find'
          );

      this.logger.error('Failed to find robot', robotError, { robotId });

      return Failure(robotError.message);
    }
  }
}
