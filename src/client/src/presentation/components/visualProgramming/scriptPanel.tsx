import React, { FC, useCallback, useEffect, useState } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { Code, Settings, PlayArrow, Pause, Stop } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ScriptPanelProps {
  height: string;
  isSimpleMode: boolean;
  onNodesChange?: (nodes: Node[]) => void;
  executionState?: 'idle' | 'running' | 'paused';
  onSettings?: () => void;
  onPlayPause?: () => void;
  onStop?: () => void;
  canExecuteScript?: boolean;
}

export const ScriptPanel: FC<ScriptPanelProps> = ({
  height,
  isSimpleMode,
  onNodesChange: onNodesChangeCallback,
  executionState = 'idle',
  onSettings,
  onPlayPause,
  onStop,
  canExecuteScript = false,
}) => {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build execution sequences based on the flow graph
  const buildExecutionSequences = useCallback((): string[][] => {
    if (edges.length === 0) {
      return []; // No connections, return empty
    }

    // Build adjacency map
    const adjacencyMap = new Map<string, string[]>();
    const incomingEdges = new Map<string, number>();

    // Initialize maps
    nodes.forEach(node => {
      adjacencyMap.set(node.id, []);
      incomingEdges.set(node.id, 0);
    });

    // Build the graph
    edges.forEach(edge => {
      if (edge.source && edge.target) {
        adjacencyMap.get(edge.source)?.push(edge.target);
        incomingEdges.set(
          edge.target,
          (incomingEdges.get(edge.target) || 0) + 1
        );
      }
    });

    // Find start nodes (nodes with no incoming edges)
    const startNodes = nodes
      .filter(node => (incomingEdges.get(node.id) || 0) === 0)
      .map(node => node.id);

    // Build sequences using DFS from each start node
    const sequences: string[][] = [];
    const visited = new Set<string>();

    const dfs = (nodeId: string, currentSequence: string[]) => {
      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      currentSequence.push(nodeId);

      const neighbors = adjacencyMap.get(nodeId) || [];
      if (neighbors.length === 0) {
        // End of sequence
        sequences.push([...currentSequence]);
      } else {
        neighbors.forEach(neighborId => {
          dfs(neighborId, [...currentSequence]);
        });
      }
    };

    startNodes.forEach(startNodeId => {
      if (!visited.has(startNodeId)) {
        dfs(startNodeId, []);
      }
    });

    return sequences;
  }, [nodes, edges]);

  const generatePythonCode = useCallback(() => {
    if (nodes.length === 0) {
      return `# ${t('visualProgramming.pythonViewer.generatedComment')}
# ${t('visualProgramming.pythonViewer.basedOnComment')}

import robot

# No blocks in script
print("${t('visualProgramming.pythonViewer.completedComment')}")`;
    }

    // Build execution sequences based on edges
    const executionSequences = buildExecutionSequences();

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
    elif block_type == 'if_condition':
        print("Evaluating condition...")
        # Condition logic would be implemented here
        return True
    elif block_type == 'while_loop':
        print("Starting loop...")
        # Loop logic would be implemented here
        return True
    elif block_type == 'wait':
        print("Waiting...")
        time.sleep(1)
    else:
        print(f"Unknown block type: {block_type}")

def main():
    """Main execution function"""
    print("Starting script execution...")
    
`;

    if (executionSequences.length === 0) {
      // No connected sequences, execute all nodes independently
      pythonCode += `    # No connections found, executing all blocks independently\n`;
      nodes.forEach(node => {
        pythonCode += `    execute_block("${node.data.blockType}", "${node.data.blockName}")  # ${node.data.blockIcon} ${node.data.blockName}\n`;
      });
    } else {
      // Execute connected sequences
      executionSequences.forEach((sequence, index) => {
        pythonCode += `    # Execution sequence ${index + 1}\n`;
        sequence.forEach(nodeId => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            pythonCode += `    execute_block("${node.data.blockType}", "${node.data.blockName}")  # ${node.data.blockIcon} ${node.data.blockName}\n`;
          }
        });
        pythonCode += '\n';
      });
    }

    pythonCode += `    print("${t('visualProgramming.pythonViewer.completedComment')}")

if __name__ == "__main__":
    main()`;

    return pythonCode;
  }, [nodes, edges, t, buildExecutionSequences]);

  // Notify parent component when nodes or edges change
  useEffect(() => {
    if (onNodesChangeCallback) {
      onNodesChangeCallback(nodes);
    }

    // Update Python code in the viewer window if it's open
    const pythonCode = generatePythonCode();
    if (window.electronAPI?.pythonCodeViewer?.updateCode) {
      window.electronAPI.pythonCodeViewer.updateCode(pythonCode);
    }
  }, [nodes, edges, onNodesChangeCallback, generatePythonCode]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const blockData = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      );
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75, // Center the node
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

  // Handle connections between nodes
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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      <Paper
        elevation={2}
        sx={{
          height: '100%',
          borderRadius: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: isSimpleMode ? 2 : 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant={isSimpleMode ? 'h5' : 'h6'}
              sx={{
                fontWeight: 600,
                fontSize: isSimpleMode ? '1.5rem' : '1.25rem',
              }}
            >
              📝 {t('visualProgramming.script.title')}
            </Typography>

            {/* Execution Status Indicator */}
            {executionState && executionState !== 'idle' && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor:
                    executionState === 'running'
                      ? 'success.light'
                      : 'warning.light',
                  color:
                    executionState === 'running'
                      ? 'success.dark'
                      : 'warning.dark',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor:
                      executionState === 'running'
                        ? 'success.main'
                        : 'warning.main',
                    animation:
                      executionState === 'running'
                        ? 'pulse 1.5s infinite'
                        : 'none',
                  }}
                />
                <Typography
                  variant='caption'
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                >
                  {t(`visualProgramming.script.status.${executionState}`)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Control Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Settings Button */}
            {onSettings && (
              <IconButton
                onClick={onSettings}
                size={isSimpleMode ? 'medium' : 'small'}
                sx={{
                  backgroundColor: 'background.paper',
                  color: 'text.secondary',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'text.primary',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Settings fontSize={isSimpleMode ? 'medium' : 'small'} />
              </IconButton>
            )}

            {/* Play/Pause Button */}
            {onPlayPause && (
              <IconButton
                onClick={onPlayPause}
                disabled={!canExecuteScript && executionState === 'idle'}
                size={isSimpleMode ? 'medium' : 'small'}
                sx={{
                  backgroundColor:
                    canExecuteScript || executionState !== 'idle'
                      ? 'success.main'
                      : 'background.paper',
                  color:
                    canExecuteScript || executionState !== 'idle'
                      ? 'success.contrastText'
                      : 'text.disabled',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor:
                      canExecuteScript || executionState !== 'idle'
                        ? 'success.dark'
                        : 'action.hover',
                    boxShadow: 2,
                  },
                  '&:disabled': {
                    backgroundColor: 'background.paper',
                    color: 'text.disabled',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {executionState === 'running' ? (
                  <Pause fontSize={isSimpleMode ? 'medium' : 'small'} />
                ) : (
                  <PlayArrow fontSize={isSimpleMode ? 'medium' : 'small'} />
                )}
              </IconButton>
            )}

            {/* Stop Button */}
            {onStop && (
              <IconButton
                onClick={onStop}
                disabled={executionState === 'idle'}
                size={isSimpleMode ? 'medium' : 'small'}
                sx={{
                  backgroundColor:
                    executionState !== 'idle'
                      ? 'error.main'
                      : 'background.paper',
                  color:
                    executionState !== 'idle'
                      ? 'error.contrastText'
                      : 'text.disabled',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor:
                      executionState !== 'idle' ? 'error.dark' : 'action.hover',
                    boxShadow: 2,
                  },
                  '&:disabled': {
                    backgroundColor: 'background.paper',
                    color: 'text.disabled',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Stop fontSize={isSimpleMode ? 'medium' : 'small'} />
              </IconButton>
            )}

            {/* Python Code View Button */}
            <IconButton
              onClick={() => {
                const pythonCode = generatePythonCode();
                if (window.electronAPI?.pythonCodeViewer?.openWindow) {
                  window.electronAPI.pythonCodeViewer.openWindow(
                    pythonCode,
                    t('visualProgramming.pythonViewer.title')
                  );
                }
              }}
              size={isSimpleMode ? 'medium' : 'small'}
              sx={{
                backgroundColor: 'secondary.main',
                color: 'secondary.contrastText',
                boxShadow: 1,
                '&:hover': {
                  backgroundColor: 'secondary.dark',
                  boxShadow: 2,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Code fontSize={isSimpleMode ? 'medium' : 'small'} />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{ height: 'calc(100% - 60px)' }}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </Box>
      </Paper>
    </Box>
  );
};
