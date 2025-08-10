import { Box } from '@mui/material';
import { type FC, useCallback, useMemo, useState, useRef, useEffect } from 'react';
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

import {
  BlocksPanel,
  type BlocksPanelLabels,
} from '../components/visualProgramming/blocksPanel';
import {
  ConsolePanel,
  type ConsolePanelLabels,
} from '../components/visualProgramming/consolePanel';
import {
  ScriptPanel,
  type ScriptPanelLabels,
} from '../components/visualProgramming/scriptPanel';
import { useAppContext } from '../hooks/useAppContext';
import type { RobotFeedback } from '../../domain/robot';
import type { ConsoleMessage } from '../models/ConsoleMessage';

enum ScriptExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
}

interface VisualProgrammingContentProps {
  isSimpleMode: boolean;
}

const VisualProgrammingFlow: FC<VisualProgrammingContentProps> = ({
  isSimpleMode,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedRobot, isRobotConnected, robots, showAlert } =
    useAppContext();
  const { screenToFlowPosition } = useReactFlow();

  // State management
  const [showConsole, setShowConsole] = useState(!isSimpleMode);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    {
      timestamp: Date.now(),
      type: 'info',
      message: t('visualProgramming.console.messages.robotInitialized'),
    },
  ]);
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

  const onNodesChanges: OnNodesChange = async changes => {
    onNodesChange(changes);
    await handleUpdateCode();
  };
  const onEdgesChanges: OnEdgesChange = async changes => {
    onEdgesChange(changes);
    await handleUpdateCode();
  };
  const onNodesDelete: OnNodesDelete = async _ => {
    await handleUpdateCode();
  };
  const onEdgesDelete: OnEdgesDelete = async _ => {
    await handleUpdateCode();
  };

  // Computed values
  const selectedRobotData = useMemo(
    () => robots.find(robot => robot.id === selectedRobot),
    [robots, selectedRobot]
  );

  const hasConnectedRobot = !!selectedRobot && isRobotConnected(selectedRobot);
  const canExecuteScript = hasConnectedRobot && nodes.length > 0;
  const scriptHeight = isSimpleMode ? (showConsole ? '60%' : '100%') : '67%';

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

  // Create memoized label objects for child components
  const blocksPanelLabels = useMemo<BlocksPanelLabels>(
    () => ({
      title: t('visualProgramming.blocks.title'),
      categories: {
        movement: t('visualProgramming.blocks.categories.movement'),
        sound: t('visualProgramming.blocks.categories.sound'),
        leds: t('visualProgramming.blocks.categories.leds'),
        sensors: t('visualProgramming.blocks.categories.sensors'),
        control: t('visualProgramming.blocks.categories.control'),
      },
      blockNames: {
        move_forward: t('visualProgramming.blocks.names.move_forward'),
        move_backward: t('visualProgramming.blocks.names.move_backward'),
        turn_left: t('visualProgramming.blocks.names.turn_left'),
        turn_right: t('visualProgramming.blocks.names.turn_right'),
        stop: t('visualProgramming.blocks.names.stop'),
        play_beep: t('visualProgramming.blocks.names.play_beep'),
        play_melody: t('visualProgramming.blocks.names.play_melody'),
        set_volume: t('visualProgramming.blocks.names.set_volume'),
        set_led_color: t('visualProgramming.blocks.names.set_led_color'),
        set_led_rgb: t('visualProgramming.blocks.names.set_led_rgb'),
        blink_leds: t('visualProgramming.blocks.names.blink_leds'),
        floor_sensor: t('visualProgramming.blocks.names.floor_sensor'),
        distance_sensor: t('visualProgramming.blocks.names.distance_sensor'),
        light_sensor: t('visualProgramming.blocks.names.light_sensor'),
        wait: t('visualProgramming.blocks.names.wait'),
        if_condition: t('visualProgramming.blocks.names.if_condition'),
        while_loop: t('visualProgramming.blocks.names.while_loop'),
        repeat: t('visualProgramming.blocks.names.repeat'),
      },
      blockDescriptions: {
        move_forward: t('visualProgramming.blocks.descriptions.move_forward'),
        move_backward: t('visualProgramming.blocks.descriptions.move_backward'),
        turn_left: t('visualProgramming.blocks.descriptions.turn_left'),
        turn_right: t('visualProgramming.blocks.descriptions.turn_right'),
        stop: t('visualProgramming.blocks.descriptions.stop'),
        play_beep: t('visualProgramming.blocks.descriptions.play_beep'),
        play_melody: t('visualProgramming.blocks.descriptions.play_melody'),
        set_volume: t('visualProgramming.blocks.descriptions.set_volume'),
        set_led_color: t('visualProgramming.blocks.descriptions.set_led_color'),
        set_led_rgb: t('visualProgramming.blocks.descriptions.set_led_rgb'),
        blink_leds: t('visualProgramming.blocks.descriptions.blink_leds'),
        floor_sensor: t('visualProgramming.blocks.descriptions.floor_sensor'),
        distance_sensor: t(
          'visualProgramming.blocks.descriptions.distance_sensor'
        ),
        light_sensor: t('visualProgramming.blocks.descriptions.light_sensor'),
        wait: t('visualProgramming.blocks.descriptions.wait'),
        if_condition: t('visualProgramming.blocks.descriptions.if_condition'),
        while_loop: t('visualProgramming.blocks.descriptions.while_loop'),
        repeat: t('visualProgramming.blocks.descriptions.repeat'),
      },
    }),
    [t]
  );

  const consolePanelLabels = useMemo<ConsolePanelLabels>(
    () => ({
      title: t('visualProgramming.console.title'),
      showConsole: t('visualProgramming.console.showConsole'),
      messages: {
        robotInitialized: t(
          'visualProgramming.console.messages.robotInitialized'
        ),
        connecting: t('visualProgramming.console.messages.connecting'),
      },
    }),
    [t]
  );

  const scriptPanelLabels = useMemo<ScriptPanelLabels>(
    () => ({
      title: t('visualProgramming.script.title'),
      status: {
        running: t('visualProgramming.script.status.running'),
        paused: t('visualProgramming.script.status.paused'),
        idle: t('visualProgramming.script.status.idle'),
      },
    }),
    [t]
  );



  // Console management
  const handleFeedback = useCallback((feedback: RobotFeedback) => {
    setConsoleMessages(prev => [
      ...prev,
      {
        timestamp: feedback.timestamp,
        type: feedback.type,
        message: feedback.message,
      },
    ]);
  }, []);

  const addConsoleMessage = useCallback((type: string, message: string) => {
    setConsoleMessages(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        type,
        message,
      },
    ]);
  }, []);

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

        setNodes(nodes => [...nodes, newNode]);

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

  // Python code generation logic
  const generatePythonCode = useCallback(() => {
    if (nodes.length === 0) {
      const generatedComment = t('visualProgramming.pythonViewer.generatedComment');
      const basedOnComment = t('visualProgramming.pythonViewer.basedOnComment');
      const completedComment = t('visualProgramming.pythonViewer.completedComment');

      return `# ${generatedComment}
# ${basedOnComment}

import robot

# No blocks in script
print("${completedComment}")`;
    }

    const generatedComment = t('visualProgramming.pythonViewer.generatedComment');
    const basedOnComment = t('visualProgramming.pythonViewer.basedOnComment');

    let pythonCode = `# ${generatedComment}
# ${basedOnComment}

import robot
import time

def execute_block(block_type, block_name):
    """Execute a single block based on its type"""
    print(f"Executing: {block_name}")

    if block_type == 'move_forward':
        robot.move_forward()
    elif block_type == 'move_backward':
        robot.move_backward()
    elif block_type == 'turn_left':
        robot.turn_left()
    elif block_type == 'turn_right':
        robot.turn_right()
    elif block_type == 'distance_sensor':
        distance = robot.get_distance()
        print(f"Distance reading: {distance}")
        return distance
    elif block_type == 'light_sensor':
        light = robot.get_light_level()
        print(f"Light level: {light}")
        return light
    elif block_type == 'camera':
        image = robot.take_photo()
        print("Photo taken")
        return image
    elif block_type == 'wait':
        print("Waiting...")
        time.sleep(1)
    else:
        print(f"Unknown block type: {block_type}")

def main():
    """Main execution function"""
    print("Starting script execution...")

    # Execute all blocks independently
`;

    nodes.forEach(node => {
      pythonCode += `    execute_block("${node.data.blockType}", "${node.data.blockName}")  # ${node.data.blockIcon} ${node.data.blockName}\n`;
    });

    const completedComment = t('visualProgramming.pythonViewer.completedComment');
    pythonCode += `    print("${completedComment}")

if __name__ == "__main__":
    main()`;

    return pythonCode;
  }, [nodes, t]);

  const handleViewPythonCode = useCallback(async () => {
    const pythonCode = generatePythonCode();
    await window.electronAPI.pythonCodeViewer.openWindow(
      pythonCode,
      t('visualProgramming.pythonViewer.title') as string
    );
  }, [generatePythonCode, t]);

  const handleUpdateCode = useCallback(async () => {
    const pythonCode = generatePythonCode();
    await window.electronAPI.pythonCodeViewer.updateCode(pythonCode);
  }, [generatePythonCode]);

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

  const handleToggleConsole = useCallback(() => {
    setShowConsole(prev => !prev);
  }, []);

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
          onNodesChange={onNodesChanges}
          onEdgesChange={onEdgesChanges}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
        />

        {/* Console Panel - Always visible in advanced mode, toggleable in simple mode */}
        {(!isSimpleMode || showConsole) && (
          <ConsolePanel
            isSimpleMode={isSimpleMode}
            isVisible={!isSimpleMode || showConsole}
            selectedRobotData={selectedRobotData}
            hasConnectedRobot={hasConnectedRobot}
            consoleMessages={consoleMessages}
            labels={consolePanelLabels}
            onToggle={handleToggleConsole}
            onFeedback={handleFeedback}
            onAddMessage={addConsoleMessage}
          />
        )}
      </Box>

      {/* Console Toggle Button for Simple Mode */}
      {isSimpleMode && !showConsole && (
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
      )}
    </>
  );
};

export const VisualProgrammingContent: FC<VisualProgrammingContentProps> = ({
  isSimpleMode,
}) => {
  return (
    <ReactFlowProvider>
      <VisualProgrammingFlow isSimpleMode={isSimpleMode} />
    </ReactFlowProvider>
  );
};
