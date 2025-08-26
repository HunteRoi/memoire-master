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
  const { hasConnectedRobot, selectedRobotData, showAlert } = useRobotConnection();
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
      const { blockName, blockType, blockParameters } = node.data;

      setCurrentlyExecutingNodeId(node.id);
      const message = consoleMessages.executingBlock;
      addConsoleMessage(message.type, message.key, { blockName });

      if (control.shouldPause) {
        return;
      }

      try {
        // Get connected robot config from robot connection context
        if (hasConnectedRobot && selectedRobotData) {
          // Generate command based on block type and parameters
          const command = generateRobotCommand(blockType, blockParameters);

          // Send command to robot
          await window.electronAPI.robotConnection.sendCommand(selectedRobotData, command);

          // Add success message to console
          addConsoleMessage('success', 'Command sent successfully: ' + command);
        } else {
          // No robot connected - simulate execution
          addConsoleMessage('warning', 'No robot connected - simulating execution');
        }
      } catch (error) {
        console.error('Failed to execute robot command:', error);
        addConsoleMessage('error', `Failed to execute command: ${error}`);
        throw error;
      }

      // Wait for command execution with cancellation support
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
    [addConsoleMessage, consoleMessages, hasConnectedRobot]
  );

  // Helper function to generate robot commands from block data
  const generateRobotCommand = useCallback((blockType: string, parameters: any = {}) => {
    switch (blockType) {
      case 'move_forward':
        const speed = parameters?.speed || 1000;
        const duration = parameters?.duration || 1;
        return `move_forward(speed=${speed}, duration=${duration})`;

      case 'move_backward':
        const backSpeed = parameters?.speed || 1000;
        const backDuration = parameters?.duration || 1;
        return `move_backward(speed=${backSpeed}, duration=${backDuration})`;

      case 'turn_left':
        const leftAngle = parameters?.angle || 90;
        const leftSpeed = parameters?.speed || 200;
        return `turn_left(angle=${leftAngle}, speed=${leftSpeed})`;

      case 'turn_right':
        const rightAngle = parameters?.angle || 90;
        const rightSpeed = parameters?.speed || 200;
        return `turn_right(angle=${rightAngle}, speed=${rightSpeed})`;

      case 'stop':
        return 'stop()';

      case 'play_beep':
        const frequency = parameters?.frequency || 440;
        const beepDuration = parameters?.duration || 0.5;
        return `play_beep(frequency=${frequency}, duration=${beepDuration})`;

      case 'play_melody':
        const melodyName = parameters?.melody_name || 'default';
        return `play_melody("${melodyName}")`;

      case 'stop_melody':
        return `stop_melody()`;

      case 'blink_leds':
        const led_id = parameters?.led_id || 'all';
        const color = parameters?.color || 'red';
        const times = parameters?.times || 1;
        const interval = parameters?.interval || 0.5;
        return `blink_leds(led_id="${led_id}", color="${color}", times=${times}, interval=${interval})`;

      case 'read_battery':
        return `read_battery()`;

      default:
        const formatted_parameters = Object.entries(parameters)
          .map(array => `${array[0]}=${typeof array[1] === 'string' ? '"'+array[1]+'"' : array[1]}`)
          .join(', ');
        return `${blockType}(${formatted_parameters})`;
    }
  }, []);

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
