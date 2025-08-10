import { Box } from '@mui/material';
import { type FC, useCallback, useMemo, useState, useRef, useEffect, SetStateAction, Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnEdgesDelete,
  type OnNodesChange,
  type OnNodesDelete,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';

import { BlocksPanel } from '../components/visualProgramming/blocksPanel';
import { ConsolePanel } from '../components/visualProgramming/consolePanel';
import { ScriptPanel } from '../components/visualProgramming/scriptPanel';
import { LabelsProvider, useVisualProgrammingLabels } from '../providers/visualProgramming/labelsProvider';
import { RobotConnectionContainer, useRobotConnection } from './visualProgramming/robotConnectionContainer';
import { CodeGenerationContainer, useCodeGeneration } from './visualProgramming/codeGenerationContainer';
import { ConsoleContainer, useConsole } from './visualProgramming/consoleContainer';

enum ScriptExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
}

interface VisualProgrammingContentProps {
  isSimpleMode: boolean;
}

interface VisualProgrammingFlowProps extends VisualProgrammingContentProps {
  nodes: Node<any, string | undefined>[];
  setNodes: Dispatch<SetStateAction<Node<any, string | undefined>[]>>;
  onNodesChange: OnNodesChange;
}

const VisualProgrammingFlow: FC<VisualProgrammingFlowProps> = ({
  isSimpleMode,
  nodes,
  setNodes,
  onNodesChange,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { blocksPanelLabels, consolePanelLabels, scriptPanelLabels } = useVisualProgrammingLabels();
  const { selectedRobotData, hasConnectedRobot, canExecuteScript, showAlert } = useRobotConnection();
  const { handleViewPythonCode, handleUpdateCode } = useCodeGeneration();
  const { consoleMessages, showConsole, handleFeedback, addConsoleMessage, handleToggleConsole } = useConsole();
  const { screenToFlowPosition } = useReactFlow();

  // State management
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update code when nodes change (including deletions)
  useEffect(() => {
    const updateCode = async () => {
      await handleUpdateCode();
    };
    updateCode();
  }, [nodes, handleUpdateCode]);
  const [executionState, setExecutionState] = useState<ScriptExecutionState>(
    ScriptExecutionState.IDLE
  );
  const [currentlyExecutingNodeId, setCurrentlyExecutingNodeId] = useState<string | null>(null);

  // Execution control
  const executionControlRef = useRef<{
    shouldStop: boolean;
    shouldPause: boolean;
    currentIndex: number;
    abortController?: AbortController;
  }>({ shouldStop: false, shouldPause: false, currentIndex: 0 });

  const onNodesChangeWithCodeUpdate: OnNodesChange = async changes => {
    onNodesChange(changes);
    // Code update will be triggered by useEffect when nodes change
  };
  const onEdgesChanges: OnEdgesChange = async changes => {
    onEdgesChange(changes);
    await handleUpdateCode();
  };
  const onNodesDelete: OnNodesDelete = async _ => {
    // Code update will be triggered by useEffect when nodes change
  };
  const onEdgesDelete: OnEdgesDelete = async _ => {
    // Code update will be triggered by useEffect when nodes change
  };

  // Computed values - adapt script height based on console visibility
  const scriptHeight = showConsole ? (isSimpleMode ? '67%' : '60%') : '100%';

  // Enhanced nodes with execution highlighting
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        backgroundColor: node.id === currentlyExecutingNodeId ? '#ffd54f' : node.style?.backgroundColor,
        border: node.id === currentlyExecutingNodeId ? '2px solid #ff9800' : node.style?.border,
        boxShadow: node.id === currentlyExecutingNodeId ? '0 4px 8px rgba(255, 152, 0, 0.3)' : node.style?.boxShadow,
      }
    }));
  }, [nodes, currentlyExecutingNodeId]);

  // React Flow handlers
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      try {
        const rawData = event.dataTransfer.getData('application/reactflow');

        if (!rawData || rawData.trim() === '') {
          console.warn('No drag data received');
          return;
        }

        let blockData;
        try {
          blockData = JSON.parse(rawData);
        } catch (parseError) {
          console.error('Invalid JSON in drag data:', parseError, 'Raw data:', rawData);
          showAlert('Invalid block data received', 'error');
          return;
        }

        // Validate block data structure
        if (!blockData || typeof blockData !== 'object' || !blockData.id || !blockData.name) {
          console.error('Invalid block data structure:', blockData);
          showAlert('Invalid block structure', 'error');
          return;
        }

        // Use ReactFlow's screenToFlowPosition for accurate positioning
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node = {
          id: `${blockData.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'default',
          position,
          data: {
            label: `${blockData.icon || '🔧'} ${blockData.name}`,
            blockType: blockData.id,
            blockName: blockData.name,
            blockIcon: blockData.icon || '🔧',
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };

        setNodes(n => [...n, newNode]);

        // Add console message for successful block addition
        addConsoleMessage('info', `Added block: ${blockData.name}`);

      } catch (error) {
        console.error('Error handling drop:', error);
        showAlert('Failed to add block', 'error');
      }
    },
    [setNodes, screenToFlowPosition, showAlert, addConsoleMessage]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        source: connection.source ?? '',
        target: connection.target ?? '',
        id: `${connection.source}-${connection.target}-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
      };
      setEdges(edges => addEdge(newEdge, edges));
    },
    [setEdges]
  );

  // Helper function for cancellable delay
  const cancellableDelay = useCallback((ms: number, abortController: AbortController): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Validate inputs
      if (typeof ms !== 'number' || ms < 0) {
        reject(new Error('Invalid delay duration'));
        return;
      }

      if (!abortController || abortController.signal.aborted) {
        reject(new Error('Execution cancelled'));
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve();
      }, ms);

      // Add abort listener
      const onAbort = () => {
        clearTimeout(timeoutId);
        reject(new Error('Execution cancelled'));
      };

      abortController.signal.addEventListener('abort', onAbort, { once: true });
    });
  }, []);

  // Script execution handlers
  const handlePlayScript = useCallback(async () => {
    if (!hasConnectedRobot) {
      showAlert(t('visualProgramming.alerts.noRobotConnected'), 'warning');
      return;
    }

    if (nodes.length === 0) {
      showAlert(t('visualProgramming.alerts.noBlocksInScript'), 'info');
      return;
    }

    const isResuming = executionState === ScriptExecutionState.PAUSED;
    const startIndex = isResuming ? executionControlRef.current.currentIndex : 0;

    // Reset or setup execution control
    executionControlRef.current = {
      shouldStop: false,
      shouldPause: false,
      currentIndex: startIndex,
      abortController: new AbortController()
    };

    setExecutionState(ScriptExecutionState.RUNNING);
    showAlert(
      isResuming
        ? t('visualProgramming.alerts.scriptResumed')
        : t('visualProgramming.alerts.scriptStarted'),
      'success'
    );

    try {
      // Validate nodes before execution
      if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error('No valid nodes to execute');
      }

      // Execute script with proper control flow
      for (let i = startIndex; i < nodes.length; i++) {
        const control = executionControlRef.current;

        // Check for stop or pause
        if (control.shouldStop) {
          break;
        }

        if (control.shouldPause) {
          control.currentIndex = i;
          setExecutionState(ScriptExecutionState.PAUSED);
          setCurrentlyExecutingNodeId(null);
          return;
        }

        const node = nodes[i];

        // Validate node structure
        if (!node || !node.id || !node.data) {
          console.warn(`Skipping invalid node at index ${i}:`, node);
          continue;
        }

        control.currentIndex = i;
        setCurrentlyExecutingNodeId(node.id);

        const blockName = node.data.blockName || node.data.label || 'Unknown block';
        addConsoleMessage('info', `Executing: ${blockName}`);

        // Cancellable delay with validation
        try {
          if (!control.abortController) {
            throw new Error('Abort controller not available');
          }
          await cancellableDelay(1500, control.abortController);
        } catch (error) {
          // Execution was cancelled or failed
          if (error instanceof Error && error.message !== 'Execution cancelled') {
            console.error('Delay error:', error);
          }
          break;
        }
      }

      // Execution completed normally
      setCurrentlyExecutingNodeId(null);
      setExecutionState(ScriptExecutionState.IDLE);
      executionControlRef.current.currentIndex = 0;

      if (!executionControlRef.current.shouldStop) {
        addConsoleMessage('success', 'Script execution completed');
      }
    } catch (error) {
      console.error('Script execution error:', error);
      setCurrentlyExecutingNodeId(null);
      setExecutionState(ScriptExecutionState.IDLE);
      executionControlRef.current.currentIndex = 0;
      addConsoleMessage('error', 'Script execution failed');
    }
  }, [hasConnectedRobot, nodes, executionState, showAlert, t, addConsoleMessage, cancellableDelay]);

  const handlePauseScript = useCallback(() => {
    if (executionState === ScriptExecutionState.RUNNING) {
      executionControlRef.current.shouldPause = true;
      showAlert(t('visualProgramming.alerts.scriptPaused'), 'info');
    }
  }, [executionState, showAlert, t]);

  const handleStopScript = useCallback(() => {
    if (executionState !== ScriptExecutionState.IDLE) {
      executionControlRef.current.shouldStop = true;
      executionControlRef.current.abortController?.abort();

      setExecutionState(ScriptExecutionState.IDLE);
      setCurrentlyExecutingNodeId(null);
      executionControlRef.current.currentIndex = 0;

      showAlert(t('visualProgramming.alerts.scriptStopped'), 'info');
      addConsoleMessage('info', 'Script execution stopped by user');
    }
  }, [executionState, showAlert, t, addConsoleMessage]);

  const handleSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);


  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      const control = executionControlRef.current;
      if (control.abortController) {
        control.abortController.abort();
      }
      control.shouldStop = true;
      control.shouldPause = false;
    };
  }, []);

  return (
    <>
      {/* Blocks Panel - Left Side (20% width) */}
      <BlocksPanel isSimpleMode={isSimpleMode} labels={blocksPanelLabels} />

      {/* Right Side Container */}
      <Box
        sx={{
          width: '80%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Script Panel */}
        <ScriptPanel
          height={scriptHeight}
          isSimpleMode={isSimpleMode}
          nodes={enhancedNodes}
          edges={edges}
          executionState={executionState}
          canExecuteScript={canExecuteScript}
          labels={scriptPanelLabels}
          onSettings={handleSettings}
          onPlayPause={
            executionState === ScriptExecutionState.RUNNING
              ? handlePauseScript
              : handlePlayScript
          }
          onStop={handleStopScript}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onConnect={onConnect}
          onViewPythonCode={handleViewPythonCode}
          onNodesChange={onNodesChangeWithCodeUpdate}
          onEdgesChange={onEdgesChanges}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
        />

        <ConsolePanel
          isSimpleMode={isSimpleMode}
          isVisible={showConsole}
          selectedRobotData={selectedRobotData}
          hasConnectedRobot={hasConnectedRobot}
          consoleMessages={consoleMessages}
          labels={consolePanelLabels}
          onToggle={handleToggleConsole}
          onFeedback={handleFeedback}
          onAddMessage={addConsoleMessage}
        />
      </Box>
    </>
  );
};

const VisualProgrammingWithRobotConnection: FC<VisualProgrammingContentProps> = ({
  isSimpleMode,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  return (
    <RobotConnectionContainer nodes={nodes}>
      <CodeGenerationContainer nodes={nodes}>
        <ConsoleContainer isSimpleMode={isSimpleMode}>
          <VisualProgrammingFlow
            isSimpleMode={isSimpleMode}
            nodes={nodes}
            setNodes={setNodes}
            onNodesChange={onNodesChange}
          />
        </ConsoleContainer>
      </CodeGenerationContainer>
    </RobotConnectionContainer>
  );
};

export const VisualProgrammingContent: FC<VisualProgrammingContentProps> = ({
  isSimpleMode,
}) => {
  return (
    <ReactFlowProvider>
      <LabelsProvider>
        <VisualProgrammingWithRobotConnection isSimpleMode={isSimpleMode} />
      </LabelsProvider>
    </ReactFlowProvider>
  );
};
