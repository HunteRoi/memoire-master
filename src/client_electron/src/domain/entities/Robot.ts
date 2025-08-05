import { RobotConnection } from './RobotConnection';

export enum RobotStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  ERROR = 'error'
}

export class Robot {
  public readonly connection: RobotConnection;

  constructor(
    ipAddress: string,
    port: number,
    public readonly status: RobotStatus = RobotStatus.DISCONNECTED
  ) {
    this.connection = new RobotConnection(ipAddress, port);
  }

  get id(): string {
    const value = this.connection.ipAddress.split('.');
    return value[value.length - 1];
  }

  get name(): string {
    return `Robot ${this.id}`;
  }

  get ip(): string {
    return this.connection.ipAddress;
  }

  get port(): number {
    return this.connection.port;
  }

  get isConnected(): boolean {
    return this.status === RobotStatus.CONNECTED
      || this.status === RobotStatus.RUNNING
      || this.status === RobotStatus.PAUSED
      || this.status === RobotStatus.STOPPING;
  }

  isValid(): boolean {
    return this.connection.isValid();
  }

  updatePort(port: number): Robot {
    return new Robot(this.connection.ipAddress, port, this.status);
  }

  updateStatus(status: RobotStatus = RobotStatus.DISCONNECTED): Robot {
    return new Robot(this.connection.ipAddress, this.connection.port, status);
  }

  isRunningScript(): boolean {
    return this.status === RobotStatus.RUNNING;
  }

  isPaused(): boolean {
    return this.status === RobotStatus.PAUSED;
  }

  isStopping(): boolean {
    return this.status === RobotStatus.STOPPING;
  }

  canStartScript(): boolean {
    return this.status === RobotStatus.CONNECTED || this.status === RobotStatus.PAUSED;
  }

  canStopScript(): boolean {
    return this.status === RobotStatus.RUNNING || this.status === RobotStatus.PAUSED;
  }
}
