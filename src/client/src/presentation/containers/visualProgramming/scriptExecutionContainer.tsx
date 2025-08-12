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
import type { Edge, Node } from 'reactflow';

import { useVisualProgrammingLabels } from '../../providers/visualProgramming/labelsProvider';
import { useConsole } from './consoleContainer';
import { useRobotConnection } from './robotConnectionContainer';
import { getExecutionOrder } from '../../utils/chainUtils';
import { validateExecution, validateNode } from '../../utils/executionValidationUtils';
import {
  type ExecutionControl,
  createExecutionControl,
  cancellableDelay
} from '../../utils/executionControlUtils';
import {
  createEnhancedNode,
  createExecutionAlerts,
  createConsoleMessages
} from '../../utils/scriptExecutionHelpers';

export enum ScriptExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
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
  edges: Edge[];
}

export const ScriptExecutionContainer: React.FC<
  ScriptExecutionContainerProps
> = ({ children, nodes, edges }) => {
  const { t } = useTranslation();
  const { hasConnectedRobot, showAlert } = useRobotConnection();
  const { blocksPanelLabels } = useVisualProgrammingLabels();
  const { addConsoleMessage } = useConsole();

  const alerts = useMemo(() => createExecutionAlerts(t), [t]);
  const consoleMessages = useMemo(() => createConsoleMessages(), []);

  const [executionState, setExecutionState] = useState<ScriptExecutionState>(
    ScriptExecutionState.IDLE
  );
  const [currentlyExecutingNodeId, setCurrentlyExecutingNodeId] = useState<
    string | null
  >(null);
  const [pausedNodeIndex, setPausedNodeIndex] = useState<number>(0);

  const executionControlRef = useRef<ExecutionControl>({
    shouldStop: false,
    shouldPause: false,
    currentIndex: 0,
  });

  const enhancedNodes = useMemo(() => {
    return nodes.map(node =>
      createEnhancedNode(node, currentlyExecutingNodeId, blocksPanelLabels.blockNames)
    );
  }, [nodes, currentlyExecutingNodeId, blocksPanelLabels.blockNames]);

  const updateExecutionState = useCallback((
    state: ScriptExecutionState,
    alertMessage: string,
    alertType: 'success' | 'info' | 'warning' | 'error',
    clearCurrentNode = false
  ) => {
    setExecutionState(state);
    if (clearCurrentNode) {
      setCurrentlyExecutingNodeId(null);
    }
    showAlert(alertMessage, alertType);
  }, [showAlert]);

  const startExecution = useCallback(
    (isResuming: boolean) => {
      const alert = isResuming ? alerts.scriptResumed : alerts.scriptStarted;
      updateExecutionState(alert.state, alert.alertMessage, alert.alertType);
    },
    [alerts, updateExecutionState]
  );

  const pauseExecution = useCallback(() => {
    const alert = alerts.scriptPaused;
    updateExecutionState(alert.state, alert.alertMessage, alert.alertType, alert.clearCurrentNode);
  }, [alerts, updateExecutionState]);

  const stopExecution = useCallback(() => {
    setCurrentlyExecutingNodeId(null);
    setExecutionState(ScriptExecutionState.IDLE);
    setPausedNodeIndex(0);
    executionControlRef.current.currentIndex = 0;
  }, []);

  const completeExecution = useCallback(
    (wasStopped: boolean) => {
      stopExecution();
      if (!wasStopped) {
        const message = consoleMessages.scriptCompleted;
        addConsoleMessage(message.type, message.key);
      }
    },
    [stopExecution, addConsoleMessage, consoleMessages]
  );

  const handleExecutionError = useCallback(
    (error: any) => {
      console.error('Script execution error:', error);
      stopExecution();
      const message = consoleMessages.scriptFailed;
      addConsoleMessage(message.type, message.key);
    },
    [stopExecution, addConsoleMessage, consoleMessages]
  );

  const executeNode = useCallback(
    async (node: Node, control: ExecutionControl) => {
      const { blockName } = node.data;

      setCurrentlyExecutingNodeId(node.id);
      const message = consoleMessages.executingBlock;
      addConsoleMessage(message.type, message.key, { blockName });

      if (control.shouldPause) {
        return;
      }

      const delayDuration = 1000;
      const checkInterval = 100; // Check every 100ms
      let elapsed = 0;

      while (elapsed < delayDuration) {
        if (control.shouldPause || control.shouldStop) {
          return;
        }

        if (control.abortController?.signal.aborted) {
          throw new Error('Execution cancelled');
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;
      }
    },
    [addConsoleMessage, consoleMessages]
  );

  const executeNodes = useCallback(
    async (startIndex: number, control: ExecutionControl) => {
      const executionOrder = getExecutionOrder(nodes, edges);

      for (let i = startIndex; i < executionOrder.length; i++) {
        if (control.shouldStop) {
          return;
        }

        if (control.shouldPause) {
          setPausedNodeIndex(i);
          pauseExecution();
          return;
        }

        const node = executionOrder[i];
        if (!validateNode(node, i)) {
          continue;
        }

        await executeNode(node, control);

        if (control.shouldPause) {
          setPausedNodeIndex(i);
          pauseExecution();
          return;
        }
      }

      // Only complete execution if we've actually finished all nodes
      completeExecution(false);
    },
    [nodes, edges, executeNode, pauseExecution, completeExecution]
  );

  const handlePlayScript = useCallback(async () => {
    const validationError = validateExecution(hasConnectedRobot, nodes.length, t);
    if (validationError) {
      showAlert(validationError, 'warning');
      return;
    }

    const isResuming = executionState === ScriptExecutionState.PAUSED;
    const startIndex = isResuming ? pausedNodeIndex : 0;

    executionControlRef.current = createExecutionControl(startIndex);
    startExecution(isResuming);

    try {
      await executeNodes(startIndex, executionControlRef.current);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Execution cancelled') {
        handleExecutionError(error);
      }
    }
  }, [
    hasConnectedRobot,
    nodes.length,
    t,
    showAlert,
    executionState,
    pausedNodeIndex,
    startExecution,
    executeNodes,
    handleExecutionError,
  ]);

  const handlePauseScript = useCallback(() => {
    if (executionState === ScriptExecutionState.RUNNING) {
      executionControlRef.current.shouldPause = true;
      const alert = alerts.scriptPausing;
      showAlert(alert.alertMessage, alert.alertType);
    }
  }, [executionState, showAlert, alerts]);

  const handleStopScript = useCallback(() => {
    if (executionState !== ScriptExecutionState.IDLE) {
      executionControlRef.current.shouldStop = true;
      executionControlRef.current.abortController?.abort();
      stopExecution();

      const alert = alerts.scriptStopped;
      showAlert(alert.alertMessage, alert.alertType);

      const message = consoleMessages.scriptStoppedByUser;
      addConsoleMessage(message.type, message.key);
    }
  }, [executionState, stopExecution, showAlert, addConsoleMessage, alerts, consoleMessages]);

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
