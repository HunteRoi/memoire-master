import { Robot } from '../../domain/entities/Robot';
import { RobotsConfigurationRepository } from '../../application/repositories/RobotsConfigurationRepository';
import { SerializedRobot } from '../types/SerializedRobot';

export class FileSystemRobotsConfigurationRepository implements RobotsConfigurationRepository {

  async loadRobots(): Promise<Robot[]> {
    try {
      const robotsData: SerializedRobot[] = [];//await window.electronAPI.readRobotsConfig();
      return robotsData.map((data: SerializedRobot) => this.deserializeRobot(data));
    } catch (error) {
      console.error('Failed to load robots configuration:', error);
      return this.getDefaultRobots();
    }
  }

  async save(robot: Robot): Promise<void> {
    try {
      const robots = await this.loadRobots();
      const existingIndex = robots.findIndex(r => r.id === robot.id);

      if (existingIndex >= 0) {
        throw new Error('Robot with this ID already exists. Use update instead.');
      }

      robots.push(robot);
      await this.saveRobots(robots);
    } catch (error) {
      throw new Error(`Failed to save robot: ${error}`);
    }
  }

  async update(robot: Robot): Promise<void> {
    try {
      const robots = await this.loadRobots();
      const index = robots.findIndex(r => r.id === robot.id);

      if (index === -1) {
        throw new Error('Robot not found for update');
      }

      robots[index] = robot;
      await this.saveRobots(robots);
    } catch (error) {
      throw new Error(`Failed to update robot: ${error}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (id === '121') {
        throw new Error('Cannot remove default robot');
      }

      const robots = await this.loadRobots();
      const filteredRobots = robots.filter(robot => robot.id !== id);

      if (filteredRobots.length === robots.length) {
        throw new Error('Robot not found for removal');
      }

      await this.saveRobots(filteredRobots);
    } catch (error) {
      throw new Error(`Failed to remove robot: ${error}`);
    }
  }

  async findById(id: string): Promise<Robot | null> {
    try {
      const robots = await this.loadRobots();
      return robots.find(robot => robot.id === id) || null;
    } catch (error) {
      console.error('Failed to find robot by ID:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      const defaultRobots = this.getDefaultRobots();
      await this.saveRobots(defaultRobots);
    } catch (error) {
      throw new Error(`Failed to clear robots configuration: ${error}`);
    }
  }

  private async saveRobots(robots: Robot[]): Promise<void> {
    try {
      const serializedRobots = robots.map(robot => this.serializeRobot(robot));
      //await window.electronAPI.writeRobotsConfig(serializedRobots);
    } catch (error) {
      throw new Error(`Failed to save robots to storage: ${error}`);
    }
  }

  private serializeRobot(robot: Robot): SerializedRobot {
    return {
      ipAddress: robot.connection.ipAddress,
      port: robot.connection.port,
    };
  }

  private deserializeRobot(data: SerializedRobot): Robot {
    return new Robot(data.ipAddress, data.port);
  }

  private getDefaultRobots(): Robot[] {
    return [
      new Robot('192.168.1.121', 443)
    ];
  }
}
