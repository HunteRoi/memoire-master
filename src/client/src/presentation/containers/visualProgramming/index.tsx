import { Visibility } from '@mui/icons-material';
import {
  type Dispatch,
  type FC,
  type SetStateAction,
  useCallback,
  useEffect,
} from 'react';
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
  useReactFlow,
} from 'reactflow';

import { BlocksPanel } from '../../components/visualProgramming/blocksPanel';
import { ConsolePanel } from '../../components/visualProgramming/consolePanel';
import { Panel } from '../../components/visualProgramming/panel';
import { ScriptPanel } from '../../components/visualProgramming/scriptPanel';
import { usePersistedNodesState } from '../../hooks/usePersistedNodesState';
import {
  LabelsProvider,
  useVisualProgrammingLabels,
} from '../../providers/visualProgramming/labelsProvider';
import {
  CodeGenerationContainer,
  useCodeGeneration,
} from './codeGenerationContainer';
import { ConsoleContainer, useConsole } from './consoleContainer';
import {
  RobotConnectionContainer,
  useRobotConnection,
} from './robotConnectionContainer';
import {
  ScriptExecutionContainer,
  ScriptExecutionState,
  useScriptExecution,
} from './scriptExecutionContainer';

interface VisualProgrammingContentProps {
  isSimpleMode: boolean;
}

interface VisualProgrammingFlowProps extends VisualProgrammingContentProps {
  nodes: Node<any, string | undefined>[];
  setNodes: Dispatch<SetStateAction<Node<any, string | undefined>[]>>;
  onNodesChange: OnNodesChange;
  edges: Edge[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onEdgesChange: OnEdgesChange;
}

const VisualProgrammingFlow: FC<VisualProgrammingFlowProps> = ({
  isSimpleMode,
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange,
}) => {
  const navigate = useNavigate();
  const {
    blocksPanelLabels,
    consolePanelLabels,
    scriptPanelLabels,
    errorMessages,
  } = useVisualProgrammingLabels();
  const { selectedRobotData, hasConnectedRobot, canExecuteScript, showAlert } =
    useRobotConnection();
  const { handleViewPythonCode, handleUpdateCode } = useCodeGeneration();
  const {
    consoleMessages,
    showConsole,
    handleFeedback,
    addConsoleMessage,
    handleToggleConsole,
    handleClearConsole,
  } = useConsole();
  const {
    executionState,
    enhancedNodes,
    handlePlayScript,
    handlePauseScript,
    handleStopScript,
  } = useScriptExecution();
  const scriptHeight = showConsole ? '60%' : '100%';
  const handleSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to update the code whenever nodes change
  useEffect(() => {
    const updateCode = async () => {
      await handleUpdateCode();
    };
    updateCode();
  }, [nodes, handleUpdateCode]);

  // React Flow
  const { screenToFlowPosition } = useReactFlow();
  const onNodesChangeWithCodeUpdate: OnNodesChange = async changes => {
    // Detect node deletions and add console messages
    changes.forEach(change => {
      if (change.type === 'remove') {
        const nodeToRemove = nodes.find(node => node.id === change.id);
        if (nodeToRemove?.data?.blockType) {
          addConsoleMessage('info', 'visualProgramming.success.blockDeleted', {
            blockId: nodeToRemove.data.blockType,
          });
        }
      }
    });

    onNodesChange(changes);
  };
  const onEdgesChangeWithCodeUpdate: OnEdgesChange = async changes => {
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

        let blockData: any;
        try {
          blockData = JSON.parse(rawData);
        } catch (parseError) {
          console.error(
            'Invalid JSON in drag data:',
            parseError,
            'Raw data:',
            rawData
          );
          showAlert(errorMessages.invalidBlockData, 'error');
          return;
        }

        // Validate block data structure
        if (
          !blockData ||
          typeof blockData !== 'object' ||
          !blockData.id ||
          !blockData.name
        ) {
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
        const translatedBlockName =
          blocksPanelLabels.blockNames[blockData.id] || blockData.name;

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
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };

        setNodes(n => [...n, newNode]);

        // Auto-connect to the latest existing block (if any blocks exist)
        if (nodes.length > 0) {
          const latestNode = nodes[nodes.length - 1];
          const newEdge: Edge = {
            source: latestNode.id,
            target: newNode.id,
            id: `${latestNode.id}-${newNode.id}-${Date.now()}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
          };
          setEdges(edges => [...edges, newEdge]);
        }

        // Add console message for successful block addition
        addConsoleMessage('info', 'visualProgramming.success.blockAdded', {
          blockId: blockData.id,
        });
      } catch (error) {
        console.error('Error handling drop:', error);
        showAlert(errorMessages.failedToAddBlock, 'error');
      }
    },
    [
      setNodes,
      setEdges,
      nodes,
      screenToFlowPosition,
      showAlert,
      addConsoleMessage,
      blocksPanelLabels,
      errorMessages,
    ]
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

  const onBlockClick = useCallback(
    (blockData: any) => {
      try {
        // Find a good position for the new block (centered with some randomization to avoid overlap)
        const baseX = 200 + Math.random() * 300; // Random X between 200-500
        const baseY = 100 + Math.random() * 200; // Random Y between 100-300
        
        const position = { x: baseX, y: baseY };

        // Get translated block name
        const translatedBlockName =
          blocksPanelLabels.blockNames[blockData.id] || blockData.name;

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
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };

        setNodes(n => [...n, newNode]);

        // Auto-connect to the latest existing block (if any blocks exist)
        if (nodes.length > 0) {
          const latestNode = nodes[nodes.length - 1];
          const newEdge: Edge = {
            source: latestNode.id,
            target: newNode.id,
            id: `${latestNode.id}-${newNode.id}-${Date.now()}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
          };
          setEdges(edges => [...edges, newEdge]);
        }

        // Add console message for successful block addition
        addConsoleMessage('info', 'visualProgramming.success.blockAdded', {
          blockId: blockData.id,
        });
      } catch (error) {
        console.error('Error handling block click:', error);
        showAlert(errorMessages.failedToAddBlock, 'error');
      }
    },
    [
      setNodes,
      setEdges,
      nodes,
      showAlert,
      addConsoleMessage,
      blocksPanelLabels,
      errorMessages,
    ]
  );

  const onClearScript = useCallback(() => {
    setNodes([]);
    setEdges([]);
    addConsoleMessage('info', 'Script cleared successfully');
  }, [setNodes, setEdges, addConsoleMessage]);

  return (
    <Panel>
      <Panel.LeftPanel>
        <BlocksPanel isSimpleMode={isSimpleMode} labels={blocksPanelLabels} onBlockClick={onBlockClick} />
      </Panel.LeftPanel>

      <Panel.RightPanel>
        <Panel.TopPanel height={scriptHeight}>
          <ScriptPanel
            height='100%'
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
            onClearScript={onClearScript}
            onNodesChange={onNodesChangeWithCodeUpdate}
            onEdgesChange={onEdgesChangeWithCodeUpdate}
          />
        </Panel.TopPanel>

        {showConsole && (
          <Panel.BottomPanel height='40%'>
            <ConsolePanel
              isSimpleMode={isSimpleMode}
              selectedRobotData={selectedRobotData}
              hasConnectedRobot={hasConnectedRobot}
              consoleMessages={consoleMessages}
              labels={consolePanelLabels}
              onToggle={handleToggleConsole}
              onFeedback={handleFeedback}
              onAddMessage={addConsoleMessage}
              onClearConsole={handleClearConsole}
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
  const { nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange } =
    usePersistedNodesState();

  return (
    <ReactFlowProvider>
      <LabelsProvider>
        <RobotConnectionContainer nodes={nodes}>
          <CodeGenerationContainer nodes={nodes}>
            <ConsoleContainer isSimpleMode={isSimpleMode}>
              <ScriptExecutionContainer nodes={nodes} edges={edges}>
                <VisualProgrammingFlow
                  isSimpleMode={isSimpleMode}
                  nodes={nodes}
                  setNodes={setNodes}
                  onNodesChange={onNodesChange}
                  edges={edges}
                  setEdges={setEdges}
                  onEdgesChange={onEdgesChange}
                />
              </ScriptExecutionContainer>
            </ConsoleContainer>
          </CodeGenerationContainer>
        </RobotConnectionContainer>
      </LabelsProvider>
    </ReactFlowProvider>
  );
};
