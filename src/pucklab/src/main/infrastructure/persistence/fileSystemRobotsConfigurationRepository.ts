import { app } from 'electron';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

import { Robot } from '../../../domain/robot';
import type { RobotsConfigurationRepository } from '../../../main/application/interfaces/robotsConfigurationRepository';

type RobotConfig = {
  ipAddress: string;
  port: number;
};

export class FileSystemRobotsConfigurationRepository
  implements RobotsConfigurationRepository
{
  private robots: RobotConfig[] = [];

  private getConfigPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'robots.json');
    } else {
      return path.join(process.cwd(), 'src', 'public', 'robots.json');
    }
  }

  private async readRobotsConfig(): Promise<RobotConfig[]> {
    try {
      const configPath = this.getConfigPath();
      const fileContent = await readFile(configPath, 'utf8');
      return (JSON.parse(fileContent) as RobotConfig[]) || null;
    } catch (error) {
      console.error('Failed to read robots config:', error);
      return null;
    }
  }

  private async writeRobotsConfig(robots: RobotConfig[]): Promise<void> {
    try {
      const configPath = this.getConfigPath();
      await writeFile(configPath, JSON.stringify(robots, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to write robots config:', error);
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
    return this.robots.map(config => new Robot(config.ipAddress, config.port));
  }

  findById(id: string): Promise<Robot | null> {
    const robotConfig = this.robots.find(cfg =>
      cfg.ipAddress.endsWith(`.${id}`)
    );
    if (robotConfig) {
      return Promise.resolve(
        new Robot(robotConfig.ipAddress, robotConfig.port)
      );
    }
    return Promise.resolve(null);
  }

  async clear(): Promise<void> {
    this.robots = [];
    await this.writeRobotsConfig([]);
  }
}
