import { Robot, RobotStatus } from "../../domain/entities/Robot";

export class RobotBuilder {
    static buildRobot(
        ipAddress: string,
        port: number
    ): Robot {
        if (!ipAddress || !port) {
            throw new Error('Invali robot configuration');
        }
        const robot = new Robot(ipAddress, port, RobotStatus.DISCONNECTED);
        return robot;
    }
}
