import { Box } from '@mui/material';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  addEdge,
  type Connection,
  type Edge,
  type Node,
  OnEdgesChange,
  OnEdgesDelete,
  OnNodesChange,
  OnNodesDelete,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import { BlocksPanel, type BlocksPanelLabels } from '../components/visualProgramming/blocksPanel';
import { ConsolePanel, type ConsolePanelLabels } from '../components/visualProgramming/consolePanel';
import { ScriptPanel, type ScriptPanelLabels } from '../components/visualProgramming/scriptPanel';
import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';

enum ScriptExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
}

import type { RobotFeedback } from '../../domain/robotFeedback';
import type { ConsoleMessage } from '../models/ConsoleMessage';

interface VisualProgrammingContentProps {
  isSimpleMode: boolean;
}

export const VisualProgrammingContent: FC<VisualProgrammingContentProps> = ({
  isSimpleMode,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedRobot, isRobotConnected, robots, showAlert } =
    useAppContext();

  // State management
  const [showConsole, setShowConsole] = useState(false);
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

  const onNodesChanges: OnNodesChange = async (changes) => {
    onNodesChange(changes);
    await handleUpdateCode();
  };
  const onEdgesChanges: OnEdgesChange = async (changes) => {
    onEdgesChange(changes);
    await handleUpdateCode();
  };
  const onNodesDelete: OnNodesDelete = async (nodes) => {
    await handleUpdateCode();
  };
  const onEdgesDelete: OnEdgesDelete = async (edges) => {
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

  // Create memoized label objects for child components
  const blocksPanelLabels = useMemo<BlocksPanelLabels>(() => ({
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
      distance_sensor: t('visualProgramming.blocks.descriptions.distance_sensor'),
      light_sensor: t('visualProgramming.blocks.descriptions.light_sensor'),
      wait: t('visualProgramming.blocks.descriptions.wait'),
      if_condition: t('visualProgramming.blocks.descriptions.if_condition'),
      while_loop: t('visualProgramming.blocks.descriptions.while_loop'),
      repeat: t('visualProgramming.blocks.descriptions.repeat'),
    },
  }), [t]);

  const consolePanelLabels = useMemo<ConsolePanelLabels>(() => ({
    title: t('visualProgramming.console.title'),
    showConsole: t('visualProgramming.console.showConsole'),
    messages: {
      robotInitialized: t('visualProgramming.console.messages.robotInitialized'),
      connecting: t('visualProgramming.console.messages.connecting'),
    },
  }), [t]);

  const scriptPanelLabels = useMemo<ScriptPanelLabels>(() => ({
    title: t('visualProgramming.script.title'),
    status: {
      running: t('visualProgramming.script.status.running'),
      paused: t('visualProgramming.script.status.paused'),
      idle: t('visualProgramming.script.status.idle'),
    },
  }), [t]);

  // React Flow handlers
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const blockData = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      );
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 25,
      };

      const newNode: Node = {
        id: `${blockData.id}-${Date.now()}`,
        type: 'default',
        position,
        data: {
          label: `${blockData.icon} ${blockData.name}`,
          blockType: blockData.id,
          blockName: blockData.name,
          blockIcon: blockData.icon,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      setNodes(nodes => [...nodes, newNode]);
    },
    [setNodes]
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
      return `# ${t('visualProgramming.pythonViewer.generatedComment')}
# ${t('visualProgramming.pythonViewer.basedOnComment')}

import robot

# No blocks in script
print("${t('visualProgramming.pythonViewer.completedComment')}")`;
    }

    let pythonCode = `# ${t('visualProgramming.pythonViewer.generatedComment')}
# ${t('visualProgramming.pythonViewer.basedOnComment')}

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

    pythonCode += `    print("${t('visualProgramming.pythonViewer.completedComment')}")

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
  }, [generatePythonCode, t]);

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

  // Script execution handlers
  const handlePlayScript = useCallback(() => {
    if (!hasConnectedRobot) {
      showAlert(t('visualProgramming.alerts.noRobotConnected'), 'warning');
      return;
    }

    if (nodes.length === 0) {
      showAlert(t('visualProgramming.alerts.noBlocksInScript'), 'info');
      return;
    }

    setExecutionState(ScriptExecutionState.RUNNING);
    showAlert(
      executionState === ScriptExecutionState.PAUSED
        ? t('visualProgramming.alerts.scriptResumed')
        : t('visualProgramming.alerts.scriptStarted'),
      'success'
    );
    // TODO: Implement actual robot script execution
  }, [hasConnectedRobot, nodes.length, executionState, showAlert, t]);

  const handlePauseScript = useCallback(() => {
    setExecutionState(ScriptExecutionState.PAUSED);
    showAlert(t('visualProgramming.alerts.scriptPaused'), 'info');
    // TODO: Implement actual robot script pause
  }, [showAlert, t]);

  const handleStopScript = useCallback(() => {
    setExecutionState(ScriptExecutionState.IDLE);
    showAlert(t('visualProgramming.alerts.scriptStopped'), 'info');
    // TODO: Implement actual robot script stop
  }, [showAlert, t]);

  const handleSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleToggleConsole = useCallback(() => {
    setShowConsole(prev => !prev);
  }, []);

  return (
    <ReactFlowProvider>
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
          nodes={nodes}
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

        {/* Console Panel - Only visible in advanced mode or when toggled in simple mode */}
        {(!isSimpleMode || showConsole) && (
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
    </ReactFlowProvider>
  );
};
