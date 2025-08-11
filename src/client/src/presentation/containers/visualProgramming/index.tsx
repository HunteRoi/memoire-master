import { type FC, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router';
import {
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import { Visibility } from '@mui/icons-material';

import { BlocksPanel } from '../../components/visualProgramming/blocksPanel';
import { ConsolePanel } from '../../components/visualProgramming/consolePanel';
import { Panel } from '../../components/visualProgramming/panel';
import { ScriptPanel } from '../../components/visualProgramming/scriptPanel';
import { LabelsProvider, useVisualProgrammingLabels } from '../../providers/visualProgramming/labelsProvider';
import { RobotConnectionContainer, useRobotConnection } from './robotConnectionContainer';
import { CodeGenerationContainer, useCodeGeneration } from './codeGenerationContainer';
import { ConsoleContainer, useConsole } from './consoleContainer';
import { ScriptExecutionContainer, useScriptExecution, ScriptExecutionState } from './scriptExecutionContainer';

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
  const { blocksPanelLabels, consolePanelLabels, scriptPanelLabels, errorMessages } = useVisualProgrammingLabels();
  const { selectedRobotData, hasConnectedRobot, canExecuteScript, showAlert } = useRobotConnection();
  const { handleViewPythonCode, handleUpdateCode } = useCodeGeneration();
  const { consoleMessages, showConsole, handleFeedback, addConsoleMessage, handleToggleConsole } = useConsole();
  const { executionState, enhancedNodes, handlePlayScript, handlePauseScript, handleStopScript } = useScriptExecution();
  const scriptHeight = showConsole ? '60%' : '100%';
  const handleSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  useEffect(() => {
    const updateCode = async () => {
      await handleUpdateCode();
    };
    updateCode();
  }, [nodes]);

  // React Flow
  const { screenToFlowPosition } = useReactFlow();
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onNodesChangeWithCodeUpdate: OnNodesChange = async changes => {
    // Detect node deletions and add console messages
    changes.forEach(change => {
      if (change.type === 'remove') {
        const nodeToRemove = nodes.find(node => node.id === change.id);
        if (nodeToRemove && nodeToRemove.data?.blockType) {
          addConsoleMessage('info', 'visualProgramming.success.blockDeleted', { blockId: nodeToRemove.data.blockType });
        }
      }
    });

    onNodesChange(changes);
  };
  const onEdgesChanges: OnEdgesChange = async changes => {
    onEdgesChange(changes);
    await handleUpdateCode();
  };

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
          showAlert(errorMessages.invalidBlockData, 'error');
          return;
        }

        // Validate block data structure
        if (!blockData || typeof blockData !== 'object' || !blockData.id || !blockData.name) {
          console.error('Invalid block data structure:', blockData);
          showAlert(errorMessages.invalidBlockStructure, 'error');
          return;
        }

        // Use ReactFlow's screenToFlowPosition for accurate positioning
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Get translated block name
        const translatedBlockName = blocksPanelLabels.blockNames[blockData.id] || blockData.name;

        const newNode: Node = {
          id: `${blockData.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'default',
          position,
          data: {
            label: `${blockData.icon || '🔧'} ${translatedBlockName}`,
            blockType: blockData.id,
            blockName: translatedBlockName,
            blockIcon: blockData.icon || '🔧',
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };

        setNodes(n => [...n, newNode]);

        // Add console message for successful block addition
        addConsoleMessage('info', 'visualProgramming.success.blockAdded', { blockId: blockData.id });

      } catch (error) {
        console.error('Error handling drop:', error);
        showAlert(errorMessages.failedToAddBlock, 'error');
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

  return (
    <Panel>
      <Panel.LeftPanel>
        <BlocksPanel isSimpleMode={isSimpleMode} labels={blocksPanelLabels} />
      </Panel.LeftPanel>

      <Panel.RightPanel>
        <Panel.TopPanel height={scriptHeight}>
          <ScriptPanel
            height="100%"
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
          />
        </Panel.TopPanel>

        {showConsole && (
          <Panel.BottomPanel height="40%">
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
          </Panel.BottomPanel>
        )}
      </Panel.RightPanel>

      {!showConsole && (
        <Panel.FloatingButton
          icon={<Visibility />}
          onClick={handleToggleConsole}
        >
          {consolePanelLabels.showConsole}
        </Panel.FloatingButton>
      )}
    </Panel>
  );
};

export const VisualProgrammingContent: FC<VisualProgrammingContentProps> = ({
  isSimpleMode,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  return (
    <ReactFlowProvider>
      <LabelsProvider>
        <RobotConnectionContainer nodes={nodes}>
          <CodeGenerationContainer nodes={nodes}>
            <ConsoleContainer isSimpleMode={isSimpleMode}>
              <ScriptExecutionContainer nodes={nodes}>
                <VisualProgrammingFlow
                  isSimpleMode={isSimpleMode}
                  nodes={nodes}
                  setNodes={setNodes}
                  onNodesChange={onNodesChange}
                  />
              </ScriptExecutionContainer>
            </ConsoleContainer>
          </CodeGenerationContainer>
        </RobotConnectionContainer>
      </LabelsProvider>
    </ReactFlowProvider>
  );
};
