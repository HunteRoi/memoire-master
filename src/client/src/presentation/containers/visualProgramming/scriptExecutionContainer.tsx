import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { Node } from 'reactflow';
import { useVisualProgrammingLabels } from '../../providers/visualProgramming/labelsProvider';
import { useConsole } from './consoleContainer';
import { useRobotConnection } from './robotConnectionContainer';

export enum ScriptExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
}

interface ExecutionControl {
  shouldStop: boolean;
  shouldPause: boolean;
  currentIndex: number;
  abortController?: AbortController;
}

export interface ScriptExecutionContextType {
  executionState: ScriptExecutionState;
  currentlyExecutingNodeId: string | null;
  enhancedNodes: Node[];
  handlePlayScript: () => Promise<void>;
  handlePauseScript: () => void;
  handleStopScript: () => void;
}

const ScriptExecutionContext = createContext<ScriptExecutionContextType | null>(
  null
);

export const useScriptExecution = (): ScriptExecutionContextType => {
  const context = useContext(ScriptExecutionContext);
  if (!context) {
    throw new Error(
      'useScriptExecution must be used within a ScriptExecutionContainer'
    );
  }
  return context;
};

interface ScriptExecutionContainerProps {
  children: ReactNode;
  nodes: Node[];
}

export const ScriptExecutionContainer: React.FC<
  ScriptExecutionContainerProps
> = ({ children, nodes }) => {
  const { t } = useTranslation();
  const { hasConnectedRobot, showAlert } = useRobotConnection();
  const { blocksPanelLabels } = useVisualProgrammingLabels();
  const { addConsoleMessage } = useConsole();

  // Execution state management
  const [executionState, setExecutionState] = useState<ScriptExecutionState>(
    ScriptExecutionState.IDLE
  );
  const [currentlyExecutingNodeId, setCurrentlyExecutingNodeId] = useState<
    string | null
  >(null);

  // Execution control ref
  const executionControlRef = useRef<ExecutionControl>({
    shouldStop: false,
    shouldPause: false,
    currentIndex: 0,
  });

  // Enhanced nodes with execution highlighting
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => {
      // Re-translate node label when language changes
      let updatedLabel = node.data?.label;
      if (node.data?.blockType && node.data?.blockIcon) {
        const translatedBlockName =
          blocksPanelLabels.blockNames[node.data.blockType];
        if (translatedBlockName) {
          updatedLabel = `${node.data.blockIcon} ${translatedBlockName}`;
        }
      }

      return {
        ...node,
        data: {
          ...node.data,
          label: updatedLabel,
          blockName:
            blocksPanelLabels.blockNames[node.data?.blockType] ||
            node.data?.blockName,
        },
        style: {
          ...node.style,
          backgroundColor:
            node.id === currentlyExecutingNodeId
              ? '#ffd54f'
              : node.style?.backgroundColor,
          border:
            node.id === currentlyExecutingNodeId
              ? '2px solid #ff9800'
              : node.style?.border,
          boxShadow:
            node.id === currentlyExecutingNodeId
              ? '0 4px 8px rgba(255, 152, 0, 0.3)'
              : node.style?.boxShadow,
        },
      };
    });
  }, [nodes, currentlyExecutingNodeId, blocksPanelLabels.blockNames]);

  // Validation functions
  const validateExecution = useCallback((): string | null => {
    if (!hasConnectedRobot) {
      return t('visualProgramming.alerts.noRobotConnected');
    }
    if (nodes.length === 0) {
      return t('visualProgramming.alerts.noBlocksInScript');
    }
    return null;
  }, [hasConnectedRobot, nodes.length, t]);

  const validateNode = useCallback((node: Node, index: number): boolean => {
    if (!node?.data?.blockType || !node?.data?.blockName) {
      console.warn(`Skipping invalid node at index ${index}:`, node);
      return false;
    }
    return true;
  }, []);

  // Execution utilities
  const createExecutionControl = useCallback(
    (startIndex: number): ExecutionControl => {
      return {
        shouldStop: false,
        shouldPause: false,
        currentIndex: startIndex,
        abortController: new AbortController(),
      };
    },
    []
  );

  const cancellableDelay = useCallback(
    (ms: number, abortController?: AbortController): Promise<void> => {
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
    },
    []
  );

  // Execution state management
  const startExecution = useCallback(
    (isResuming: boolean) => {
      setExecutionState(ScriptExecutionState.RUNNING);
      showAlert(
        isResuming
          ? t('visualProgramming.alerts.scriptResumed')
          : t('visualProgramming.alerts.scriptStarted'),
        'success'
      );
    },
    [showAlert, t]
  );

  const pauseExecution = useCallback(() => {
    setExecutionState(ScriptExecutionState.PAUSED);
    setCurrentlyExecutingNodeId(null);
    showAlert(t('visualProgramming.alerts.scriptPaused'), 'info');
  }, [showAlert, t]);

  const stopExecution = useCallback(() => {
    setCurrentlyExecutingNodeId(null);
    setExecutionState(ScriptExecutionState.IDLE);
    executionControlRef.current.currentIndex = 0;
  }, []);

  const completeExecution = useCallback(
    (wasStopped: boolean) => {
      stopExecution();
      if (!wasStopped) {
        addConsoleMessage(
          'success',
          t('visualProgramming.console.scriptCompleted')
        );
      }
    },
    [stopExecution, addConsoleMessage, t]
  );

  const handleExecutionError = useCallback(
    (error: any) => {
      console.error('Script execution error:', error);
      stopExecution();
      addConsoleMessage('error', t('visualProgramming.console.scriptFailed'));
    },
    [stopExecution, addConsoleMessage, t]
  );

  // Node execution
  const executeNode = useCallback(
    async (node: Node, control: ExecutionControl) => {
      const { blockName } = node.data;

      // Highlight current node
      setCurrentlyExecutingNodeId(node.id);
      addConsoleMessage(
        'info',
        t('visualProgramming.console.executingBlock', { blockName })
      );

      // Simulate block execution
      await cancellableDelay(1000, control.abortController);
    },
    [addConsoleMessage, cancellableDelay, t]
  );

  // Main execution loop
  const executeNodes = useCallback(
    async (startIndex: number, control: ExecutionControl) => {
      for (let i = startIndex; i < nodes.length; i++) {
        // Check for stop signal
        if (control.shouldStop) {
          break;
        }

        // Check for pause signal
        if (control.shouldPause) {
          control.currentIndex = i;
          pauseExecution();
          return;
        }

        const node = nodes[i];
        if (!validateNode(node, i)) {
          continue;
        }

        control.currentIndex = i;
        await executeNode(node, control);
      }
    },
    [nodes, validateNode, executeNode, pauseExecution]
  );

  // Main execution handlers
  const handlePlayScript = useCallback(async () => {
    const validationError = validateExecution();
    if (validationError) {
      showAlert(validationError, 'warning');
      return;
    }

    const isResuming = executionState === ScriptExecutionState.PAUSED;
    const startIndex = isResuming
      ? executionControlRef.current.currentIndex
      : 0;

    // Setup execution control
    executionControlRef.current = createExecutionControl(startIndex);
    startExecution(isResuming);

    try {
      await executeNodes(startIndex, executionControlRef.current);
      completeExecution(executionControlRef.current.shouldStop);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Execution cancelled') {
        handleExecutionError(error);
      }
    }
  }, [
    validateExecution,
    showAlert,
    executionState,
    createExecutionControl,
    startExecution,
    executeNodes,
    completeExecution,
    handleExecutionError,
  ]);

  const handlePauseScript = useCallback(() => {
    if (executionState === ScriptExecutionState.RUNNING) {
      executionControlRef.current.shouldPause = true;
      showAlert(t('visualProgramming.alerts.scriptPausing'), 'info');
    }
  }, [executionState, showAlert, t]);

  const handleStopScript = useCallback(() => {
    if (executionState !== ScriptExecutionState.IDLE) {
      executionControlRef.current.shouldStop = true;
      executionControlRef.current.abortController?.abort();
      stopExecution();
      showAlert(t('visualProgramming.alerts.scriptStopped'), 'info');
      addConsoleMessage(
        'info',
        t('visualProgramming.console.scriptStoppedByUser')
      );
    }
  }, [executionState, stopExecution, showAlert, t, addConsoleMessage]);

  const contextValue = useMemo<ScriptExecutionContextType>(
    () => ({
      executionState,
      currentlyExecutingNodeId,
      enhancedNodes,
      handlePlayScript,
      handlePauseScript,
      handleStopScript,
    }),
    [
      executionState,
      currentlyExecutingNodeId,
      enhancedNodes,
      handlePlayScript,
      handlePauseScript,
      handleStopScript,
    ]
  );

  return (
    <ScriptExecutionContext.Provider value={contextValue}>
      {children}
    </ScriptExecutionContext.Provider>
  );
};
