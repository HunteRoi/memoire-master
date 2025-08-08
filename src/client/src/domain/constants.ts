import { Robot } from './robot';

export const DEFAULT_PORT = 8765;

const defaultRobotResult = Robot.create()
  .setIpAddress('192.168.1.121')
  .setPort(DEFAULT_PORT)
  .build();

if (!defaultRobotResult.success) {
  throw new Error(
    `Failed to create default robot: ${defaultRobotResult.error}`
  );
}

export const DEFAULT_ROBOT = defaultRobotResult.data;
