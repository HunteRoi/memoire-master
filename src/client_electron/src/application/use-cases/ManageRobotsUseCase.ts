import { Robot } from '../../domain/entities/Robot';
import { RobotsConfigurationRepository } from '../repositories/RobotsConfigurationRepository';

export class ManageRobotsUseCase {
  constructor(
    private robotsConfigurationRepository: RobotsConfigurationRepository,
  ) { }

  async loadRobots(): Promise<Robot[]> {
    return await this.robotsConfigurationRepository.loadRobots();
  }

  async addRobot(robot: Robot): Promise<void> {
    if (!robot || !robot.connection || !robot.connection.isValid()) {
      throw new Error('Invalid robot configuration');
    }
    const exists = this.robotsConfigurationRepository.findById(robot.id);
    if (exists) {
      throw new Error('This robot already exists');
    }
    await this.robotsConfigurationRepository.save(robot);
  }

  async updateRobot(robot: Robot): Promise<void> {
    if (!robot.id) {
      throw new Error('Robot ID is required for update');
    }
    const existingRobot = await this.robotsConfigurationRepository.findById(robot.id);
    if (!existingRobot) {
      throw new Error('Robot not found for update');
    }
    await this.robotsConfigurationRepository.update(robot);
  }

  async removeRobot(robotId: string): Promise<void> {
    if (!robotId) {
      throw new Error('Robot ID is required for removal');
    }

    if (robotId === '121') {
      throw new Error('Cannot remove default robot');
    }

    const existingRobot = await this.robotsConfigurationRepository.findById(robotId);
    if (!existingRobot) {
      throw new Error('Robot not found for removal');
    }
    await this.robotsConfigurationRepository.remove(robotId);
  }
}
