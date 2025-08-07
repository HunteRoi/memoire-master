import React, { FC, useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { Code, Settings, PlayArrow, Pause, Stop } from '@mui/icons-material';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
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
  canExecuteScript = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Notify parent component when nodes change
  useEffect(() => {
    if (onNodesChangeCallback) {
      onNodesChangeCallback(nodes);
    }
    
    // Update Python code in the viewer window if it's open
    const pythonCode = generatePythonCode();
    if (window.electronAPI?.pythonCodeViewer?.updateCode) {
      window.electronAPI.pythonCodeViewer.updateCode(pythonCode);
    }
  }, [nodes, onNodesChangeCallback]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const blockData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
    
    const newNode: Node = {
      id: `${blockData.id}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: { label: `${blockData.icon} ${blockData.name}` },
    };
    
    setNodes((nodes) => [...nodes, newNode]);
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const generatePythonCode = () => {
    return `# Generated Python Script
# Based on visual blocks in the script area

import robot

${nodes.map(node => `# ${node.data.label}
robot.execute("${node.id}")`).join('\n')}

print("Script execution completed")`;
  };

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
        <Box sx={{ 
          p: isSimpleMode ? 2 : 1.5, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant={isSimpleMode ? 'h5' : 'h6'} 
              sx={{ 
                fontWeight: 600,
                fontSize: isSimpleMode ? '1.5rem' : '1.25rem'
              }}
            >
              📝 Script
            </Typography>
            
            {/* Execution Status Indicator */}
            {executionState && executionState !== 'idle' && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 2,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: executionState === 'running' ? 'success.light' : 'warning.light',
                color: executionState === 'running' ? 'success.dark' : 'warning.dark',
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%',
                  backgroundColor: executionState === 'running' ? 'success.main' : 'warning.main',
                  animation: executionState === 'running' ? 'pulse 1.5s infinite' : 'none',
                }} />
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {executionState}
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
                  backgroundColor: canExecuteScript || executionState !== 'idle' 
                    ? 'success.main' 
                    : 'background.paper',
                  color: canExecuteScript || executionState !== 'idle' 
                    ? 'success.contrastText' 
                    : 'text.disabled',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: canExecuteScript || executionState !== 'idle' 
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
                {executionState === 'running' ? 
                  <Pause fontSize={isSimpleMode ? 'medium' : 'small'} /> : 
                  <PlayArrow fontSize={isSimpleMode ? 'medium' : 'small'} />
                }
              </IconButton>
            )}

            {/* Stop Button */}
            {onStop && (
              <IconButton
                onClick={onStop}
                disabled={executionState === 'idle'}
                size={isSimpleMode ? 'medium' : 'small'}
                sx={{
                  backgroundColor: executionState !== 'idle' 
                    ? 'error.main' 
                    : 'background.paper',
                  color: executionState !== 'idle' 
                    ? 'error.contrastText' 
                    : 'text.disabled',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: executionState !== 'idle' 
                      ? 'error.dark' 
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
                <Stop fontSize={isSimpleMode ? 'medium' : 'small'} />
              </IconButton>
            )}

            {/* Python Code View Button */}
            <IconButton
              onClick={() => {
                const pythonCode = generatePythonCode();
                if (window.electronAPI?.pythonCodeViewer?.openWindow) {
                  window.electronAPI.pythonCodeViewer.openWindow(pythonCode, 'Generated Python Code');
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
            fitView
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