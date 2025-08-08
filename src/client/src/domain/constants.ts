import { Robot } from './robot';

const defaultRobotResult = Robot.create()
  .setIpAddress('192.168.1.121')
  .setPort(443)
  .build();

if (!defaultRobotResult.success) {
  throw new Error(
    `Failed to create default robot: ${defaultRobotResult.error}`
  );
}

export const DEFAULT_ROBOT = defaultRobotResult.data;
