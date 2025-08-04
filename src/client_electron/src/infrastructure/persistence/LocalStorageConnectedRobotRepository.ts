import { Robot } from '../../domain/entities/Robot';
import { ConnectedRobotRepository } from '../../application/repositories/ConnectedRobotRepository';
import { SerializedRobot } from '../types/SerializedRobot';

export class LocalStorageConnectedRobotRepository implements ConnectedRobotRepository {
  private readonly STORAGE_KEY = 'connectedRobots';

  async save(robot: Robot): Promise<void> {
    try {
      const robots = await this.loadConnectedRobots();
      const index = robots.findIndex(r => r.id === robot.id);

      if (index >= 0) {
        robots[index] = robot;
      } else {
        robots.push(robot);
      }

      await this.saveConnectedRobots(robots);
    } catch (error) {
      throw new Error(`Failed to save connected robot: ${error}`);
    }
  }

  async update(robot: Robot): Promise<void> {
    try {
      const robots = await this.loadConnectedRobots();
      const index = robots.findIndex(r => r.id === robot.id);

      if (index === -1) {
        throw new Error('Connected robot not found for update');
      }

      robots[index] = robot;
      await this.saveConnectedRobots(robots);
    } catch (error) {
      throw new Error(`Failed to update connected robot: ${error}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const robots = await this.loadConnectedRobots();
      const filteredRobots = robots.filter(robot => robot.id !== id);
      await this.saveConnectedRobots(filteredRobots);
    } catch (error) {
      throw new Error(`Failed to remove connected robot: ${error}`);
    }
  }

  async findById(id: string): Promise<Robot | null> {
    try {
      const robots = await this.loadConnectedRobots();
      return robots.find(robot => robot.id === id) || null;
    } catch (error) {
      console.error('Failed to find connected robot by ID:', error);
      return null;
    }
  }

  async loadConnectedRobots(): Promise<Robot[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const robotsData = JSON.parse(stored);
      return robotsData.map((data: SerializedRobot) => this.deserializeRobot(data));
    } catch (error) {
      console.error('Failed to load connected robots:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      throw new Error(`Failed to clear connected robots: ${error}`);
    }
  }

  private async saveConnectedRobots(robots: Robot[]): Promise<void> {
    try {
      const serializedRobots = robots.map(robot => this.serializeRobot(robot));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializedRobots));
    } catch (error) {
      throw new Error(`Failed to save connected robots to storage: ${error}`);
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
}
