export interface ExecutionControl {
  shouldStop: boolean;
  shouldPause: boolean;
  currentIndex: number;
  abortController?: AbortController;
}

export const createExecutionControl = (startIndex: number): ExecutionControl => {
  return {
    shouldStop: false,
    shouldPause: false,
    currentIndex: startIndex,
    abortController: new AbortController(),
  };
};

export const cancellableDelay = (
  ms: number,
  abortController?: AbortController
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (ms < 0) {
      reject(new Error('Delay must be non-negative'));
      return;
    }

    if (!abortController || abortController.signal.aborted) {
      reject(new Error('Execution cancelled'));
      return;
    }

    const timeoutId = setTimeout(() => {
      if (abortController.signal.aborted) {
        reject(new Error('Execution cancelled'));
        return;
      }
      resolve();
    }, ms);

    abortController.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Execution cancelled'));
    });
  });
};