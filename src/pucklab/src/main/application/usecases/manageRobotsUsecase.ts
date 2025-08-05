import { Robot } from '../../../domain/robot';
import type { RobotsConfigurationRepository } from '../interfaces/robotsConfigurationRepository';

const DEFAULT_ROBOT: Robot = new Robot('192.168.1.121', 443);

export class ManageRobotsUseCase {
  constructor(
    private robotsConfigurationRepository: RobotsConfigurationRepository,
  ) { }

  async loadRobots(): Promise<Robot[]> {
    try {
      return await this.robotsConfigurationRepository.loadRobots();
    }
    catch (error) {
      console.error(error);
      return [];
    }
  }

  async addRobot(robot: Robot): Promise<Robot[]> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot || !bot.isValid()) {
        throw new Error('Invalid robot configuration');
      }

      const exists = await this.robotsConfigurationRepository.findById(bot.id);
      if (exists) {
        throw new Error('This robot already exists');
      }

      await this.robotsConfigurationRepository.save(robot);
      return await this.loadRobots();
    }
    catch (error) {
      console.error(error);
      return [];
    }
  }

  async updateRobot(robot: Robot): Promise<Robot[]> {
    try {
      const bot = new Robot(robot.ipAddress, robot.port);
      if (!bot.id) {
        throw new Error('Robot ID is required for update');
      }

      const existingRobot = await this.robotsConfigurationRepository.findById(bot.id);
      if (!existingRobot) {
        throw new Error('Robot not found for update');
      }

      await this.robotsConfigurationRepository.update(robot);
      return await this.loadRobots();
    }
    catch (error) {
      console.error(error);
      return [];
    }
  }

  async removeRobot(robotId: string): Promise<Robot[]> {
    try {
      if (!robotId) {
        throw new Error('Robot ID is required for removal');
      }

      if (robotId === DEFAULT_ROBOT.id) {
        throw new Error('Cannot remove default robot');
      }

      const existingRobot = await this.robotsConfigurationRepository.findById(robotId);
      if (!existingRobot) {
        throw new Error('Robot not found for removal');
      }

      await this.robotsConfigurationRepository.remove(robotId);
      return await this.loadRobots();
    }
    catch (error) {
      console.error(error);
      return [];
    }
  }

  async clearRobots(): Promise<Robot[]> {
    try {
      await this.robotsConfigurationRepository.clear();
      await this.robotsConfigurationRepository.save(DEFAULT_ROBOT);
      return await this.loadRobots();
    }
    catch (error) {
      console.error(error);
      return [];
    }
  }

  async findRobotById(robotId: string): Promise<Robot | null> {
    try {
      if (!robotId) {
        throw new Error('Robot ID is required for search');
      }
      return await this.robotsConfigurationRepository.findById(robotId);
    }
    catch (error) {
      console.error(error);
      return null;
    }
  }
}
