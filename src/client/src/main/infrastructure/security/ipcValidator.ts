import { RobotValidationError } from '../../../domain/errors';
import { isSuccess, type Result } from '../../../domain/result';
import { Robot, type RobotConfig } from '../../../domain/robot';
import type { Logger } from '../../../main/application/interfaces/logger';

/**
 * Security layer that validates and sanitizes data coming through the IPC channels.
 *
 * @export
 * @class IpcValidator
 */
export class IpcValidator {
  private readonly MAX_STRING_LENGTH = 1000;
  private readonly MAX_COMMAND_LENGTH = 500;
  private readonly MAX_ROBOT_ID_LENGTH = 255;

  private readonly ALLOWED_CHANNELS = new Set([
    'manageRobots:loadRobots',
    'manageRobots:addRobot',
    'manageRobots:updateRobot',
    'manageRobots:removeRobot',
    'manageRobots:clearRobots',
    'manageRobots:findRobotById',
    'robotConnection:connectToRobot',
    'robotConnection:disconnectFromRobot',
    'robotConnection:checkConnection',
    'robotFeedback:subscribe',
    'robotFeedback:unsubscribe',
    'robotFeedback:sendCommand',
    'app:getVersion',
    'app:isPackaged',
    'pythonCodeViewer:show',
    'pythonCodeViewer:hide',
    'pythonCodeViewer:updateCode',
  ]);

  constructor(private readonly logger: Logger) { }

  private sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[^\x20-\x7E]/g, ''); // Remove control characters by filtering out non-printable characters
  }

  /**
   * Validates if an IPC channel is allowed
   */
  isChannelAllowed(channel: string): boolean {
    const allowed = this.ALLOWED_CHANNELS.has(channel);
    if (!allowed) {
      this.logger.warn('Blocked unauthorized IPC channel access', undefined, {
        channel,
      });
    }
    return allowed;
  }

  /**
   * Validates and sanitizes robot configuration input
   */
  validateRobotConfig(input: unknown): RobotConfig {
    if (!input || typeof input !== 'object') {
      throw new RobotValidationError(
        'Invalid robot configuration: must be an object'
      );
    }

    const robotInput = input as Record<string, unknown>;

    if (typeof robotInput.ipAddress !== 'string') {
      throw new RobotValidationError(
        'Invalid robot configuration: ipAddress must be a string',
        'ipAddress'
      );
    }

    const sanitizedIp = this.sanitizeString(robotInput.ipAddress, 15);
    if (sanitizedIp.length === 0) {
      throw new RobotValidationError(
        'Invalid robot configuration: ipAddress cannot be empty',
        'ipAddress'
      );
    }

    if (
      typeof robotInput.port !== 'number' ||
      !Number.isInteger(robotInput.port)
    ) {
      throw new RobotValidationError(
        'Invalid robot configuration: port must be an integer',
        'port'
      );
    }

    const robotConfig: RobotConfig = {
      ipAddress: sanitizedIp,
      port: robotInput.port,
    };

    const robotResult: Result<Robot> = Robot.create()
      .setIpAddress(robotConfig.ipAddress)
      .setPort(robotConfig.port)
      .build();

    if (!isSuccess(robotResult)) {
      throw new RobotValidationError(
        `Robot configuration validation failed: ${robotResult.error}`,
        'robot'
      );
    }

    return robotConfig;
  }

  /**
   * Validates and sanitizes robot ID input
   */
  validateRobotId(input: unknown): string {
    if (typeof input !== 'string') {
      throw new RobotValidationError(
        'Invalid robot ID: must be a string',
        'robotId'
      );
    }

    const sanitizedId = this.sanitizeString(input, this.MAX_ROBOT_ID_LENGTH);
    if (sanitizedId.length === 0) {
      throw new RobotValidationError(
        'Invalid robot ID: cannot be empty',
        'robotId'
      );
    }

    return sanitizedId;
  }

  /**
   * Validates and sanitizes command input
   */
  validateCommand(input: unknown): string {
    if (typeof input !== 'string') {
      throw new RobotValidationError(
        'Invalid command: must be a string',
        'command'
      );
    }

    const sanitizedCommand = this.sanitizeString(
      input,
      this.MAX_COMMAND_LENGTH
    );
    if (sanitizedCommand.length === 0) {
      throw new RobotValidationError(
        'Invalid command: cannot be empty',
        'command'
      );
    }

    const dangerousPatterns = [
      /[;&|`$()]/g, // Command injection characters
      /\.\./g, // Directory traversal
      /\/etc\//gi, // System file access
      /\/bin\//gi, // Binary execution
      /rm\s+-rf/gi, // Dangerous delete commands
      /sudo/gi, // Privilege escalation
      /chmod/gi, // Permission changes
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitizedCommand)) {
        this.logger.warn('Blocked potentially dangerous command', undefined, {
          command: sanitizedCommand.substring(0, 50),
        });
        throw new RobotValidationError(
          'Invalid command: contains potentially dangerous patterns',
          'command'
        );
      }
    }

    return sanitizedCommand;
  }

  /**
   * Validates string input with length limits
   */
  validateString(
    input: unknown,
    fieldName: string,
    maxLength?: number
  ): string {
    if (typeof input !== 'string') {
      throw new RobotValidationError(
        `Invalid ${fieldName}: must be a string`,
        fieldName
      );
    }

    const sanitized = this.sanitizeString(
      input,
      maxLength || this.MAX_STRING_LENGTH
    );
    if (sanitized.length === 0 && input.trim().length > 0) {
      throw new RobotValidationError(
        `Invalid ${fieldName}: contains invalid characters`,
        fieldName
      );
    }

    return sanitized;
  }
}
