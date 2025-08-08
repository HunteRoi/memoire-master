import { app } from 'electron';

import type {
  RobotCommunicationService,
  RobotsConfigurationRepository,
} from './application/interfaces';
import type { Logger } from './application/interfaces/logger';
import { ManageRobotConnection, ManageRobots } from './application/usecases';
import {
  MockRobotCommunicationService,
  WebsocketRobotCommunicationService,
} from './infrastructure/communication';
import { getLogger } from './infrastructure/logging/logger';
import { FileSystemRobotsConfigurationRepository } from './infrastructure/persistence/fileSystemRobotsConfigurationRepository';

export class Container {
  private static instance: Container;

  public readonly logger: Logger;

  private _robotCommunicationService: RobotCommunicationService;
  private _robotsConfigurationRepository: RobotsConfigurationRepository;

  private _manageRobots: ManageRobots;
  private _robotConnection: ManageRobotConnection;

  private constructor() {
    const isDevelopment = !app.isPackaged;
    this.logger = getLogger();
    this._robotCommunicationService = isDevelopment
      ? new MockRobotCommunicationService(this.logger)
      : new WebsocketRobotCommunicationService(this.logger);
    this._robotsConfigurationRepository =
      new FileSystemRobotsConfigurationRepository(this.logger);

    // USE CASES
    this._manageRobots = new ManageRobots(
      this._robotsConfigurationRepository,
      this.logger
    );
    this._robotConnection = new ManageRobotConnection(
      this._robotCommunicationService,
      this.logger
    );

    this.logger.info('Container initialized', {
      mode: isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION',
      communicationService: isDevelopment ? 'Mock' : 'WebSocket',
    });
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  get manageRobots(): ManageRobots {
    return this._manageRobots;
  }
  get robotConnection(): ManageRobotConnection {
    return this._robotConnection;
  }
}
