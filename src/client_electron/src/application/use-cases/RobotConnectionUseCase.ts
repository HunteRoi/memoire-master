import { Robot, RobotStatus } from '../../domain/entities/Robot';
import { RobotCommunicationService } from '../services/RobotCommunicationService';

export class RobotConnectionUseCase {
  constructor(private robotRepository: RobotCommunicationService) { }

  async connectToRobot(robot: Robot): Promise<Robot> {
    if (!robot.connection.isValid()) {
      throw new Error('Invalid robot connection parameters');
    }

    try {
      const connectedRobot = await this.robotRepository.connect(robot);
      await this.robotRepository.save(connectedRobot);
      return connectedRobot;
    }
    catch (error) {
      const failedConnectionRobot = robot.updateStatus(RobotStatus.ERROR);
      await this.robotRepository.save(failedConnectionRobot);
      throw error;
    }
  }

  async disconnectFromRobot(robot: Robot): Promise<Robot> {
    if (!this.robotRepository.isConnected(robot)) {
      throw new Error('Robot is not connected');
    }

    try {
      const disconnectedRobot = await this.robotRepository.disconnect(robot);
      await this.robotRepository.save(disconnectedRobot);
      return disconnectedRobot;
    }
    catch (error) {
      const failedDisconnectionRobot = robot.updateStatus(RobotStatus.ERROR);
      await this.robotRepository.save(failedDisconnectionRobot);
      throw error;
    }
  }

  async checkConnection(robot: Robot): Promise<boolean> {
    try {
      const isConnected = await this.robotRepository.isConnected(robot);
      if (isConnected) {
        return true;
      }

      const connectedRobot = await this.robotRepository.connect(robot);
      if (connectedRobot.status === RobotStatus.CONNECTED) {
        await this.robotRepository.disconnect(connectedRobot);
        return true;
      }
    }
    catch (error) {
      return false;
    }
  }
}
