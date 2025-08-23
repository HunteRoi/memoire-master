import type WebSocket from 'ws';

import { Failure, type Result, Success, type ValidationResult } from './result';

export class Robot {
  constructor(
    public readonly ipAddress: string,
    public readonly port: number
  ) { }

  get id(): string {
    const value = this.ipAddress.split('.');
    return value[value.length - 1];
  }

  get name(): string {
    return `Robot ${this.id}`;
  }

  static create(): RobotBuilder {
    return new RobotBuilder();
  }
}

export type RobotConfig = Pick<Robot, 'ipAddress' | 'port'>;

export class RobotBuilder {
  private ipAddress?: string;
  private port?: number;

  setIpAddress(ipAddress: string): RobotBuilder {
    this.ipAddress = ipAddress?.trim();
    return this;
  }

  setPort(port: number): RobotBuilder {
    this.port = port;
    return this;
  }

  build(): Result<Robot> {
    if (!this.ipAddress) {
      return Failure('IP address is required');
    }

    if (this.port === undefined) {
      return Failure('Port is required');
    }

    const validation = this.validateInputs(this.ipAddress, this.port);
    if (!validation.isValid) {
      return Failure(
        `Robot validation failed: ${validation.errors.join(', ')}`
      );
    }

    const robot = new Robot(this.ipAddress, this.port);
    return Success(robot);
  }

  private validateInputs(ipAddress: string, port: number): ValidationResult {
    const errors: string[] = [];

    const ipValidation = this.validateIpAddress(ipAddress);
    if (!ipValidation.isValid) {
      errors.push(...ipValidation.errors);
    }

    const portValidation = this.validatePort(port);
    if (!portValidation.isValid) {
      errors.push(...portValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateIpAddress(ipAddress: string): ValidationResult {
    const errors: string[] = [];

    if (!ipAddress || ipAddress.trim().length === 0) {
      errors.push('IP address is required');
      return { isValid: false, errors };
    }

    const trimmedIp = ipAddress.trim();

    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(trimmedIp)) {
      errors.push(
        'Invalid IP address format. Expected IPv4 format (e.g., 192.168.0.1)'
      );
      return { isValid: false, errors };
    }

    const octets = trimmedIp.split('.').map(Number);
    for (const octet of octets) {
      if (octet < 0 || octet > 255) {
        errors.push('IP address octets must be between 0 and 255');
        break;
      }
    }

    if (trimmedIp === '0.0.0.0') {
      errors.push('IP address 0.0.0.0 is not allowed');
    }
    if (trimmedIp === '255.255.255.255') {
      errors.push('Broadcast address 255.255.255.255 is not allowed');
    }

    return { isValid: errors.length === 0, errors };
  }

  private validatePort(port: number): ValidationResult {
    const errors: string[] = [];

    if (!Number.isInteger(port)) {
      errors.push('Port must be an integer');
      return { isValid: false, errors };
    }

    if (port <= 0) {
      errors.push('Port must be greater than 0');
    }

    if (port >= 65536) {
      errors.push('Port must be less than 65536');
    }

    return { isValid: errors.length === 0, errors };
  }
}

export interface RobotFeedbackData {
  battery?: number;
  sensors?: unknown;
  uptime?: number;
  messageParams?: Record<string, any>;
  rawData?: string;
  error?: any;
  [key: string]: any;
}

export interface RobotFeedback {
  robotId: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: RobotFeedbackData;
}

export type RobotFeedbackCallback = (feedback: RobotFeedback) => void;

export interface ConnectedRobot {
  robot: Robot;
  websocket: WebSocket; // design decision to let external package blood into the domain layer
  connected: boolean;
  lastPing: number;
  feedbackCallback?: RobotFeedbackCallback;
  batteryPercentage?: number;
  batteryVoltage?: number;
  robotStatus?: string;
  hardwareStatus?: {
    motors: boolean;
    leds: boolean;
    audio: boolean;
    sensors: boolean;
  };
}

export interface RobotMessageData {
  command?: string;
  source?: string;
  [key: string]: any;
}

export interface RobotMessage {
  type: 'command' | 'ping' | 'status';
  data: RobotMessageData;
  timestamp: number;
}

export interface RobotResponseData {
  battery?: number;
  battery_voltage?: number;
  sensors?: unknown;
  status?: string;
  client_count?: number;
  robot_id?: string;
  hardware?: {
    motors: boolean;
    leds: boolean;
    audio: boolean;
    sensors: boolean;
  };
  result?: any;
  rawData?: string;
  [key: string]: any;
}

export interface RobotResponse {
  type: 'success' | 'error' | 'status' | 'pong';
  data?: RobotResponseData;
  message?: string;
  timestamp: number;
}
