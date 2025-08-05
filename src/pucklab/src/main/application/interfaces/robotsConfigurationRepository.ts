import type { Robot } from '../../../domain/robot';

export interface RobotsConfigurationRepository {
  save(robot: Robot): Promise<void>;
  update(robot: Robot): Promise<void>;
  remove(id: string): Promise<void>;

  loadRobots(): Promise<Robot[]>;
  findById(id: string): Promise<Robot | null>;
  clear(): Promise<void>;
}
