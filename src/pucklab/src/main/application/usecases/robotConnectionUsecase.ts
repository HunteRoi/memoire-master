import { Robot } from '../../../domain/robot';
import { RobotCommunicationService } from '../interfaces/robotCommunicationService';

export class RobotConnectionUseCase {
  constructor(
    private robotRepository: RobotCommunicationService
  ) { }

  async connectToRobot(robot: Robot): Promise<Robot> {
    if (!robot.isValid()) {
      throw new Error('Invalid robot connection parameters');
    }

    return await this.robotRepository.connect(robot);
  }

  async disconnectFromRobot(robot: Robot): Promise<Robot> {
    if (!this.robotRepository.isConnected(robot)) {
      throw new Error('Robot is not connected');
    }

    return await this.robotRepository.disconnect(robot);
  }

  async checkConnection(robot: Robot): Promise<boolean> {
    if (!robot.isValid()) {
      return false;
    }

    const isConnected = await this.robotRepository.isConnected(robot);
    if (isConnected) {
      return true;
    }

    try {
      const connectedRobot = await this.robotRepository.connect(robot);
      if (connectedRobot) {
        await this.robotRepository.disconnect(connectedRobot);
        return true;
      }
      return false;
    }
    catch (error) {
      return false;
    }
  }
}
