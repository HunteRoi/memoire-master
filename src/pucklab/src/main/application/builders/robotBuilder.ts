import { Robot } from '../../../domain/robot';

export class RobotBuilder {
  static buildRobot(
    ipAddress: string,
    port: number
  ): Robot {
    if (!ipAddress || !port) {
      throw new Error('Invalid robot configuration');
    }
    return new Robot(ipAddress, port);
  }
}
