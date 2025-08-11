import { Clear, Code, Pause, PlayArrow, Settings, Stop } from '@mui/icons-material';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import type { DragEvent, FC } from 'react';
import ReactFlow, {
  Background,
  type Connection,
  ConnectionMode,
  Controls,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

export interface ScriptPanelLabels {
  title: string;
  status: {
    running: string;
    paused: string;
    idle: string;
  };
  tooltips: {
    settings: string;
    playPause: string;
    stop: string;
    clear: string;
    viewCode: string;
  };
}

interface ScriptPanelProps {
  height: string;
  isSimpleMode: boolean;
  nodes: Node[];
  executionState: 'idle' | 'running' | 'paused';
  canExecuteScript: boolean;
  labels: ScriptPanelLabels;
  onSettings: () => void;
  onPlayPause: () => void;
  onStop: () => void;
  onDrop: (event: DragEvent) => void;
  onDragOver: (event: DragEvent) => void;
  onConnect: (connection: Connection) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onViewPythonCode: () => void;
  onClearScript: () => void;
  edges: Edge[];
}

export const ScriptPanel: FC<ScriptPanelProps> = ({
  height,
  isSimpleMode,
  nodes,
  executionState,
  canExecuteScript,
  labels,
  onSettings,
  onPlayPause,
  onStop,
  onDrop,
  onDragOver,
  onConnect,
  onNodesChange,
  onEdgesChange,
  onViewPythonCode,
  onClearScript,
  edges,
}) => {
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
              📝 {labels.title}
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
                  {labels.status[executionState]}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Control Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Settings Button */}
            <Tooltip title={labels.tooltips.settings}>
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
            </Tooltip>

            {/* Play/Pause Button */}
            <Tooltip title={labels.tooltips.playPause}>
              <span>
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
              </span>
            </Tooltip>

            {/* Stop Button */}
            <Tooltip title={labels.tooltips.stop}>
              <span>
                <IconButton
                  onClick={onStop}
                  disabled={executionState === 'idle'}
                  size={isSimpleMode ? 'medium' : 'small'}
                  sx={{
                    backgroundColor:
                      executionState !== 'idle' ? 'error.main' : 'background.paper',
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
              </span>
            </Tooltip>

            {/* Clear Script Button */}
            <Tooltip title={labels.tooltips.clear}>
              <IconButton
                onClick={onClearScript}
                size={isSimpleMode ? 'medium' : 'small'}
                sx={{
                  backgroundColor: 'warning.main',
                  color: 'warning.contrastText',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: 'warning.dark',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Clear fontSize={isSimpleMode ? 'medium' : 'small'} />
              </IconButton>
            </Tooltip>

            {/* Python Code View Button */}
            <Tooltip title={labels.tooltips.viewCode}>
              <IconButton
                onClick={onViewPythonCode}
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
            </Tooltip>
          </Box>
        </Box>

        <Box
          sx={{ height: 'calc(100% - 60px)', pb: 2 }}
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
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </Box>
      </Paper>
    </Box>
  );
};
