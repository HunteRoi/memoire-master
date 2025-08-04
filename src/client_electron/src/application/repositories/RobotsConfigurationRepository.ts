import { Robot } from '../../domain/entities/Robot';

export interface RobotsConfigurationRepository {
  loadRobots(): Promise<Robot[] | null>;
  save(robot: Robot): Promise<void>;
  update(robot: Robot): Promise<void>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<Robot | null>;
  clear(): Promise<void>;
}
