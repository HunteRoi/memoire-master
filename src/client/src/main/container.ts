import { app } from 'electron';

import type { RobotCommunicationService } from './application/interfaces/robotCommunicationService';
import type { RobotsConfigurationRepository } from './application/interfaces/robotsConfigurationRepository';
import { ManageRobotsUseCase } from './application/usecases/manageRobotsUsecase';
import { RobotConnectionUseCase } from './application/usecases/robotConnectionUsecase';
import { MockRobotCommunicationService } from './infrastructure/communication/mockRobotCommunicationService';
import { WebsocketRobotCommunicationService } from './infrastructure/communication/websocketRobotCommunicationService';
import { FileSystemRobotsConfigurationRepository } from './infrastructure/persistence/fileSystemRobotsConfigurationRepository';

export class Container {
  private static instance: Container;

  private _robotCommunicationService: RobotCommunicationService;
  private _robotsConfigurationRepository: RobotsConfigurationRepository;

  private _manageRobotsUseCase: ManageRobotsUseCase;
  private _robotConnectionUseCase: RobotConnectionUseCase;

  private constructor() {
    // Initialize infrastructure layer
    const isDevelopment = !app.isPackaged;

    this._robotCommunicationService = isDevelopment
      ? new MockRobotCommunicationService()
      : new WebsocketRobotCommunicationService();

    this._robotsConfigurationRepository =
      new FileSystemRobotsConfigurationRepository();

    this._manageRobotsUseCase = new ManageRobotsUseCase(
      this._robotsConfigurationRepository
    );
    this._robotConnectionUseCase = new RobotConnectionUseCase(
      this._robotCommunicationService
    );

    console.log(
      `🔧 Container initialized in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`
    );
    console.log(
      `🤖 Using ${isDevelopment ? 'Mock' : 'WebSocket'} robot communication service`
    );
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // Getters for use cases
  get manageRobotsUseCase(): ManageRobotsUseCase {
    return this._manageRobotsUseCase;
  }

  get robotConnectionUseCase(): RobotConnectionUseCase {
    return this._robotConnectionUseCase;
  }
}
