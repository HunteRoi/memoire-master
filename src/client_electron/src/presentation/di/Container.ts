import { WebSocketRobotCommunicationService } from '../../infrastructure/connection/WebSocketRobotCommunicationService';
import { FileSystemRobotsConfigurationRepository } from '../../infrastructure/persistence/FileSystemRobotsConfigurationRepository';
import { LocalStorageConnectedRobotRepository } from '../../infrastructure/persistence/LocalStorageConnectedRobotRepository';
import { ManageRobotsUseCase } from '../../application/use-cases/ManageRobotsUseCase';
import { RobotConnectionUseCase } from '../../application/use-cases/RobotConnectionUseCase';
import { RobotCommunicationService } from '../../application/services/RobotCommunicationService';
import { RobotsConfigurationRepository } from '../../application/repositories/RobotsConfigurationRepository';
import { ConnectedRobotRepository } from '../../application/repositories/ConnectedRobotRepository';

export class Container {
  private static instance: Container;

  // Infrastructure layer services and repositories
  private _webSocketRobotCommunicationService: WebSocketRobotCommunicationService;
  private _fileSystemRobotsConfigurationRepository: FileSystemRobotsConfigurationRepository;
  private _localStorageConnectedRobotRepository: LocalStorageConnectedRobotRepository;

  // Application layer use cases
  private _manageRobotsUseCase: ManageRobotsUseCase;
  private _robotConnectionUseCase: RobotConnectionUseCase;

  private constructor() {
    // Initialize infrastructure layer
    this._webSocketRobotCommunicationService = new WebSocketRobotCommunicationService();
    this._fileSystemRobotsConfigurationRepository = new FileSystemRobotsConfigurationRepository();
    this._localStorageConnectedRobotRepository = new LocalStorageConnectedRobotRepository();

    // Initialize application layer use cases with dependencies
    this._manageRobotsUseCase = new ManageRobotsUseCase(
      this._fileSystemRobotsConfigurationRepository
    );
    this._robotConnectionUseCase = new RobotConnectionUseCase(
      this._webSocketRobotCommunicationService
    );
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // Infrastructure layer getters
  get webSocketRobotCommunicationService(): WebSocketRobotCommunicationService {
    return this._webSocketRobotCommunicationService;
  }

  get fileSystemRobotsConfigurationRepository(): FileSystemRobotsConfigurationRepository {
    return this._fileSystemRobotsConfigurationRepository;
  }

  get localStorageConnectedRobotRepository(): LocalStorageConnectedRobotRepository {
    return this._localStorageConnectedRobotRepository;
  }

  // Interface-based getters for dependency injection
  get robotCommunicationService(): RobotCommunicationService {
    return this._webSocketRobotCommunicationService;
  }

  get robotsConfigurationRepository(): RobotsConfigurationRepository {
    return this._fileSystemRobotsConfigurationRepository;
  }

  get connectedRobotRepository(): ConnectedRobotRepository {
    return this._localStorageConnectedRobotRepository;
  }

  // Application layer use cases getters
  get manageRobotsUseCase(): ManageRobotsUseCase {
    return this._manageRobotsUseCase;
  }

  get robotConnectionUseCase(): RobotConnectionUseCase {
    return this._robotConnectionUseCase;
  }
}
