export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RobotValidationError extends DomainError {
  readonly code = 'ROBOT_VALIDATION_ERROR';
  readonly severity = 'medium' as const;

  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
  }
}

export class RobotConnectionError extends DomainError {
  readonly code = 'ROBOT_CONNECTION_ERROR';
  readonly severity = 'high' as const;

  constructor(
    message: string,
    public readonly robotId?: string
  ) {
    super(message);
  }
}

export class RobotCommandError extends DomainError {
  readonly code = 'ROBOT_COMMAND_ERROR';
  readonly severity = 'medium' as const;

  constructor(
    message: string,
    public readonly command?: string,
    public readonly robotId?: string
  ) {
    super(message);
  }
}

export class RobotConfigurationError extends DomainError {
  readonly code = 'ROBOT_CONFIGURATION_ERROR';
  readonly severity = 'medium' as const;

  constructor(
    message: string,
    public readonly operation?: string
  ) {
    super(message);
  }
}

export class RobotTimeoutError extends DomainError {
  readonly code = 'ROBOT_TIMEOUT_ERROR';
  readonly severity = 'high' as const;

  constructor(
    message: string,
    public readonly timeoutMs?: number,
    public readonly robotId?: string
  ) {
    super(message);
  }
}

export function isRobotError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function createErrorResponse(error: unknown): {
  success: false;
  error: string;
  code?: string;
} {
  if (isRobotError(error)) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  return {
    success: false,
    error: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
}
