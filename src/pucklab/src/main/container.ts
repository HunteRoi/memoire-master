import { RobotCommunicationService } from './application/interfaces/robotCommunicationService';
import { RobotsConfigurationRepository } from './application/interfaces/robotsConfigurationRepository';
import { WebsocketRobotCommunicationService } from './infrastructure/communication/websocketRobotCommunicationService';
import { ManageRobotsUseCase } from './application/usecases/manageRobotsUsecase';
import { RobotConnectionUseCase } from './application/usecases/robotConnectionUsecase';
import { FileSystemRobotsConfigurationRepository } from './infrastructure/persistence/fileSystemRobotsConfigurationRepository';

export class Container {
  private static instance: Container;

  private _robotCommunicationService: RobotCommunicationService;
  private _robotsConfigurationRepository: RobotsConfigurationRepository;

  private _manageRobotsUseCase: ManageRobotsUseCase;
  private _robotConnectionUseCase: RobotConnectionUseCase;

  private constructor() {
    // Initialize infrastructure layer
    this._robotCommunicationService = new WebsocketRobotCommunicationService();
    this._robotsConfigurationRepository =
      new FileSystemRobotsConfigurationRepository();
    this._manageRobotsUseCase = new ManageRobotsUseCase(
      this._robotsConfigurationRepository
    );
    this._robotConnectionUseCase = new RobotConnectionUseCase(
      this._robotCommunicationService
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
