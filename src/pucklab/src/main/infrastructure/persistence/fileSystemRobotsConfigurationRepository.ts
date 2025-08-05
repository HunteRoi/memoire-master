import { app } from 'electron';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

import { Robot } from '../../../domain/robot';
import { RobotsConfigurationRepository } from '../../../main/application/interfaces/robotsConfigurationRepository';

export class FileSystemRobotsConfigurationRepository implements RobotsConfigurationRepository {
  private getConfigPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'robots.json');
    } else {
      return path.join(process.cwd(), 'src', 'public', 'robots.json');
    }
  }

  private async readRobotsConfig(): Promise<Robot[] | null> {
    try {
      const configPath = this.getConfigPath();
      const fileContent = await readFile(configPath, 'utf8');
      return JSON.parse(fileContent) as Robot[] || null;
    }
    catch (error) {
      console.error('Failed to read robots config:', error);
      return null;
    }
  }

  private async writeRobotsConfig(robots: Robot[]): Promise<void> {
    try {
      const configPath = this.getConfigPath();
      await writeFile(configPath, JSON.stringify(robots, null, 2), 'utf8');
    }
    catch (error) {
      console.error('Failed to write robots config:', error);
      throw error;
    }
  }

  save(robot: Robot): Promise<void> {
    throw new Error("Method not implemented.");
  }
  update(robot: Robot): Promise<void> {
    throw new Error("Method not implemented.");
  }
  remove(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  loadRobots(): Promise<Robot[] | null> {
    throw new Error("Method not implemented.");
  }
  findById(id: string): Promise<Robot | null> {
    throw new Error("Method not implemented.");
  }
  clear(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
