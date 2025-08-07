import { Box } from '@mui/material';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  addEdge,
  type Connection,
  type Edge,
  type Node,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import { BlocksPanel } from '../components/visualProgramming/blocksPanel';
import { ConsolePanel } from '../components/visualProgramming/consolePanel';
import { ScriptPanel } from '../components/visualProgramming/scriptPanel';
import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';

enum ScriptExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
}

import type { RobotFeedback } from '../../domain/RobotFeedback';
import type { ConsoleMessage } from '../models/Console';

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
  const [scriptNodes, setScriptNodes] = useState<Node[]>([]);
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

  useEnsureData();

  // Computed values
  const selectedRobotData = useMemo(
    () => robots.find(robot => robot.id === selectedRobot),
    [robots, selectedRobot]
  );

  const hasConnectedRobot = !!selectedRobot && isRobotConnected(selectedRobot);
  const canExecuteScript = hasConnectedRobot && scriptNodes.length > 0;
  const scriptHeight = isSimpleMode ? (showConsole ? '60%' : '100%') : '67%';

  // Update scriptNodes when nodes change
  useEffect(() => {
    setScriptNodes(nodes);
  }, [nodes]);

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
        ...connection,
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

  const handleViewPythonCode = useCallback(() => {
    const pythonCode = generatePythonCode();
    if (window.electronAPI?.pythonCodeViewer?.openWindow) {
      window.electronAPI.pythonCodeViewer.openWindow(
        pythonCode,
        t('visualProgramming.pythonViewer.title')
      );
    }
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

    if (scriptNodes.length === 0) {
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
  }, [hasConnectedRobot, scriptNodes.length, executionState, showAlert, t]);

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
      <BlocksPanel isSimpleMode={isSimpleMode} />

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
          onNodesChange={setScriptNodes}
          executionState={executionState}
          canExecuteScript={canExecuteScript}
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
          onNodesChangeInternal={onNodesChange}
          onEdgesChange={onEdgesChange}
          onViewPythonCode={handleViewPythonCode}
        />

        {/* Console Panel - Only visible in advanced mode or when toggled in simple mode */}
        {(!isSimpleMode || showConsole) && (
          <ConsolePanel
            isSimpleMode={isSimpleMode}
            isVisible={showConsole}
            selectedRobotData={selectedRobotData}
            hasConnectedRobot={hasConnectedRobot}
            consoleMessages={consoleMessages}
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
          onToggle={handleToggleConsole}
          onFeedback={handleFeedback}
          onAddMessage={addConsoleMessage}
        />
      )}
    </ReactFlowProvider>
  );
};
