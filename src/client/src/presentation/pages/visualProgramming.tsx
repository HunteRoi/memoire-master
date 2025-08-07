import { FC, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, IconButton } from '@mui/material';
import { Settings, PlayArrow, Pause, Stop } from '@mui/icons-material';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';
import { BlocksPanel } from '../components/visualProgramming/blocksPanel';
import { ScriptPanel } from '../components/visualProgramming/scriptPanel';
import { ConsolePanel } from '../components/visualProgramming/consolePanel';

enum ScriptExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
}

export const VisualProgramming: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { userAge, selectedRobot, isRobotConnected, showAlert } =
    useAppContext();
  const [showConsole, setShowConsole] = useState(false);
  const [scriptNodes, setScriptNodes] = useState([]);
  const [executionState, setExecutionState] = useState<ScriptExecutionState>(
    ScriptExecutionState.IDLE
  );

  useEnsureData();

  const isSimpleMode = userAge.isSimpleMode();
  const scriptHeight = isSimpleMode ? (showConsole ? '60%' : '100%') : '67%';

  const hasConnectedRobot = selectedRobot && isRobotConnected(selectedRobot);
  const canExecuteScript = hasConnectedRobot && scriptNodes.length > 0;

  const handlePlayScript = () => {
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
  };

  const handlePauseScript = () => {
    setExecutionState(ScriptExecutionState.PAUSED);
    showAlert(t('visualProgramming.alerts.scriptPaused'), 'info');
    // TODO: Implement actual robot script pause
  };

  const handleStopScript = () => {
    setExecutionState(ScriptExecutionState.IDLE);
    showAlert(t('visualProgramming.alerts.scriptStopped'), 'info');
    // TODO: Implement actual robot script stop
  };

  return (
    <ReactFlowProvider>
      <Box sx={{ height: '100vh', display: 'flex', position: 'relative' }}>
        {/* Main Layout */}
        <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
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
              onNodesChange={setScriptNodes}
              executionState={executionState}
              onSettings={() => navigate('/settings')}
              onPlayPause={
                executionState === ScriptExecutionState.RUNNING
                  ? handlePauseScript
                  : handlePlayScript
              }
              onStop={handleStopScript}
              canExecuteScript={canExecuteScript}
            />

            {/* Console Panel - Only visible in advanced mode or when toggled in simple mode */}
            {(!isSimpleMode || showConsole) && (
              <ConsolePanel
                isSimpleMode={isSimpleMode}
                isVisible={showConsole}
                onToggle={() => setShowConsole(!showConsole)}
              />
            )}
          </Box>
        </Box>

        {/* Console Toggle Button for Simple Mode */}
        {isSimpleMode && !showConsole && (
          <ConsolePanel
            isSimpleMode={isSimpleMode}
            isVisible={showConsole}
            onToggle={() => setShowConsole(!showConsole)}
          />
        )}
      </Box>
    </ReactFlowProvider>
  );
};
