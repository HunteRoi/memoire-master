import { Robot, type RobotConfig } from '../../../domain/robot';
import { Result, Success, Failure } from '../../../domain/result';
import { DEFAULT_ROBOT } from '../../../domain/constants';
import type { RobotsConfigurationRepository } from '../interfaces/robotsConfigurationRepository';

export class ManageRobotsUseCase {
  constructor(
    private robotsConfigurationRepository: RobotsConfigurationRepository
  ) { }

  async loadRobots(): Promise<Result<Robot[]>> {
    try {
      const robots = await this.robotsConfigurationRepository.loadRobots();
      return Success(robots);
    } catch (error) {
      console.error(error);
      return Failure('Failed to load robots configuration');
    }
  }

  async addRobot(robot: RobotConfig): Promise<Result<RobotConfig[]>> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot || !bot.isValid()) {
        throw new Error('Invalid robot configuration');
      }

      const exists = await this.robotsConfigurationRepository.findById(bot.id);
      if (exists) {
        throw new Error('This robot already exists');
      }

      await this.robotsConfigurationRepository.save(bot);
      const result = await this.loadRobots();
      return result.success ? Success(result.data) : result;
    } catch (error) {
      console.error(error);
      return Failure(
        error instanceof Error ? error.message : 'Failed to add robot'
      );
    }
  }

  async updateRobot(robot: RobotConfig): Promise<Result<RobotConfig[]>> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot.id) {
        throw new Error('Robot ID is required for update');
      }

      const existingRobot = await this.robotsConfigurationRepository.findById(
        bot.id
      );
      if (!existingRobot) {
        throw new Error('Robot not found for update');
      }

      await this.robotsConfigurationRepository.update(bot);
      const result = await this.loadRobots();
      return result.success ? Success(result.data) : result;
    } catch (error) {
      console.error(error);
      return Failure(
        error instanceof Error ? error.message : 'Failed to update robot'
      );
    }
  }

  async removeRobot(robotId: string): Promise<Result<RobotConfig[]>> {
    try {
      if (!robotId) {
        throw new Error('Robot ID is required for removal');
      }

      if (robotId === DEFAULT_ROBOT.id) {
        throw new Error('Cannot remove default robot');
      }

      const existingRobot =
        await this.robotsConfigurationRepository.findById(robotId);
      if (!existingRobot) {
        throw new Error('Robot not found for removal');
      }

      await this.robotsConfigurationRepository.remove(robotId);
      const result = await this.loadRobots();
      return result.success ? Success(result.data) : result;
    } catch (error) {
      console.error(error);
      return Failure(
        error instanceof Error ? error.message : 'Failed to remove robot'
      );
    }
  }

  async clearRobots(): Promise<Result<RobotConfig[]>> {
    try {
      await this.robotsConfigurationRepository.clear();
      await this.robotsConfigurationRepository.save(DEFAULT_ROBOT);
      const result = await this.loadRobots();
      return result.success ? Success(result.data) : result;
    } catch (error) {
      console.error(error);
      return Failure('Failed to clear robots configuration');
    }
  }

  async findRobotById(robotId: string): Promise<Result<RobotConfig>> {
    try {
      if (!robotId) {
        throw new Error('Robot ID is required for search');
      }
      const robot = await this.robotsConfigurationRepository.findById(robotId);
      if (!robot) {
        throw new Error('Robot not found');
      }
      return Success(robot);
    } catch (error) {
      console.error(error);
      return Failure(
        error instanceof Error ? error.message : 'Failed to find robot'
      );
    }
  }
}
