import { WebSocket } from "node:http";

import { Robot } from '../../../domain/robot';
import { RobotCommunicationService } from '../../../main/application/interfaces/robotCommunicationService';

export class WebsocketRobotCommunicationService implements RobotCommunicationService {
    connect(robot: Robot): Promise<Robot> {
        throw new Error("Method not implemented.");
    }
    disconnect(robot: Robot): Promise<Robot> {
        throw new Error("Method not implemented.");
    }
    isConnected(robot: Robot): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    sendCommand(robot: Robot, command: string): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
}
