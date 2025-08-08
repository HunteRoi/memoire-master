import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import { isSuccess, type Result } from '../../../domain/result';
import { Robot, type RobotConfig } from '../../../domain/robot';
import type { Logger } from '../../../main/application/interfaces/logger';
import type { RobotsConfigurationRepository } from '../../application/interfaces/robotsConfigurationRepository';

export class FileSystemRobotsConfigurationRepository
  implements RobotsConfigurationRepository
{
  private robots: RobotConfig[] = [];

  constructor(private logger: Logger) {}

  private getConfigPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'robots.json');
    } else {
      return path.join(process.cwd(), 'src', 'public', 'robots.json');
    }
  }

  private async readRobotsConfig(): Promise<RobotConfig[] | null> {
    try {
      const configPath = this.getConfigPath();
      const fileContent = await readFile(configPath, 'utf8');
      return (JSON.parse(fileContent) as RobotConfig[]) || null;
    } catch (error) {
      this.logger.error('Failed to read robots config:', error as Error);
      return null;
    }
  }

  private async writeRobotsConfig(robots: RobotConfig[]): Promise<void> {
    try {
      const configPath = this.getConfigPath();
      await writeFile(configPath, JSON.stringify(robots, null, 2), 'utf8');
    } catch (error) {
      this.logger.error('Failed to write robots config:', error as Error);
      throw error;
    }
  }

  async save(robot: Robot): Promise<void> {
    const robotConfig = robot as RobotConfig;
    const existingIndex = this.robots.findIndex(
      cfg => cfg.ipAddress === robotConfig.ipAddress
    );
    if (existingIndex !== -1) {
      throw new Error('Robot with this IP address already exists.');
    }
    this.robots.push(robotConfig);
    await this.writeRobotsConfig(this.robots);
  }

  async update(robot: Robot): Promise<void> {
    const robotConfig = robot as RobotConfig;
    const index = this.robots.findIndex(
      cfg => cfg.ipAddress === robotConfig.ipAddress
    );
    if (index === -1) {
      throw new Error('Robot with this IP address does not exist.');
    }
    this.robots[index] = robotConfig;
    await this.writeRobotsConfig(this.robots);
  }

  async remove(id: string): Promise<void> {
    const index = this.robots.findIndex(cfg =>
      cfg.ipAddress.endsWith(`.${id}`)
    );
    if (index === -1) {
      throw new Error('Robot with this IP address does not exist.');
    }
    this.robots.splice(index, 1);
    await this.writeRobotsConfig(this.robots);
  }

  async loadRobots(): Promise<Robot[]> {
    const robotConfigs = await this.readRobotsConfig();
    this.robots = robotConfigs || [];

    const validRobots: Robot[] = [];

    for (const config of this.robots) {
      const robotResult: Result<Robot> = Robot.create()
        .setIpAddress(config.ipAddress)
        .setPort(config.port)
        .build();

      if (isSuccess(robotResult)) {
        validRobots.push(robotResult.data);
      } else {
        this.logger.error(
          `Failed to create robot from config:`,
          new Error(robotResult.error),
          {
            ipAddress: config.ipAddress,
            port: config.port,
          }
        );
      }
    }

    return validRobots;
  }

  findById(id: string): Promise<Robot | null> {
    const robotConfig = this.robots.find(cfg =>
      cfg.ipAddress.endsWith(`.${id}`)
    );
    if (robotConfig) {
      const robotResult: Result<Robot> = Robot.create()
        .setIpAddress(robotConfig.ipAddress)
        .setPort(robotConfig.port)
        .build();

      if (isSuccess(robotResult)) {
        return Promise.resolve(robotResult.data);
      } else {
        this.logger.error(
          `Failed to create robot from config:`,
          new Error(robotResult.error),
          {
            ipAddress: robotConfig.ipAddress,
            port: robotConfig.port,
          }
        );
        return Promise.resolve(null);
      }
    }
    return Promise.resolve(null);
  }

  async clear(): Promise<void> {
    this.robots = [];
    await this.writeRobotsConfig([]);
  }
}
