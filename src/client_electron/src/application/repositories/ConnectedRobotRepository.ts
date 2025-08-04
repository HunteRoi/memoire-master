import { Robot } from '../../domain/entities/Robot';

export interface ConnectedRobotRepository {
  save(robot: Robot): Promise<void>;
  update(robot: Robot): Promise<void>;
  remove(id: string): Promise<void>;
}
