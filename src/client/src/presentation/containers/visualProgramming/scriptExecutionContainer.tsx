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
import { getExecutionOrder } from '../../utils/executionOrderUtils';
import { validateExecution, validateNode } from '../../utils/executionValidationUtils';
import { 
  type ExecutionControl,
  createExecutionControl,
  cancellableDelay 
} from '../../utils/executionControlUtils';

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

  const [executionState, setExecutionState] = useState<ScriptExecutionState>(
    ScriptExecutionState.IDLE
  );
  const [currentlyExecutingNodeId, setCurrentlyExecutingNodeId] = useState<
    string | null
  >(null);

  const executionControlRef = useRef<ExecutionControl>({
    shouldStop: false,
    shouldPause: false,
    currentIndex: 0,
  });

  const enhancedNodes = useMemo(() => {
    return nodes.map(node => {
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
          'visualProgramming.console.scriptCompleted'
        );
      }
    },
    [stopExecution, addConsoleMessage]
  );

  const handleExecutionError = useCallback(
    (error: any) => {
      console.error('Script execution error:', error);
      stopExecution();
      addConsoleMessage('error', 'visualProgramming.console.scriptFailed');
    },
    [stopExecution, addConsoleMessage]
  );

  const executeNode = useCallback(
    async (node: Node, control: ExecutionControl) => {
      const { blockName } = node.data;

      setCurrentlyExecutingNodeId(node.id);
      addConsoleMessage(
        'info',
        'visualProgramming.console.executingBlock', 
        { blockName }
      );

      await cancellableDelay(1000, control.abortController);
    },
    [addConsoleMessage, cancellableDelay]
  );

  const executeNodes = useCallback(
    async (startIndex: number, control: ExecutionControl) => {
      const executionOrder = getExecutionOrder(nodes, edges);

      for (let i = startIndex; i < executionOrder.length; i++) {
        if (control.shouldStop) {
          break;
        }

        if (control.shouldPause) {
          control.currentIndex = i;
          pauseExecution();
          return;
        }

        const node = executionOrder[i];
        if (!validateNode(node, i)) {
          continue;
        }

        control.currentIndex = i;
        await executeNode(node, control);
      }
    },
    [nodes, edges, executeNode, pauseExecution]
  );

  const handlePlayScript = useCallback(async () => {
    const validationError = validateExecution(hasConnectedRobot, nodes.length, t);
    if (validationError) {
      showAlert(validationError, 'warning');
      return;
    }

    const isResuming = executionState === ScriptExecutionState.PAUSED;
    const startIndex = isResuming
      ? executionControlRef.current.currentIndex
      : 0;

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
    hasConnectedRobot,
    nodes.length,
    t,
    showAlert,
    executionState,
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
        'visualProgramming.console.scriptStoppedByUser'
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
