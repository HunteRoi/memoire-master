export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type Result<T> =
  | {
    readonly success: true;
    readonly data: T;
  }
  | {
    readonly success: false;
    readonly error: string;
  };

export const Success = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

export const Failure = <T>(error: string): Result<T> => ({
  success: false,
  error,
});

export const isSuccess = <T>(
  result: Result<T>
): result is Extract<Result<T>, { success: true }> => result.success;
