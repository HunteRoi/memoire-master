import { RobotConnection } from '../../domain/entities/RobotConnection';

export type SerializedRobot = Pick<RobotConnection, 'ipAddress' | 'port'>;
