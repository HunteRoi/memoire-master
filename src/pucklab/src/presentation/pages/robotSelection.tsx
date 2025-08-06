import { FC, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useAppContext } from '../hooks/useAppContext';
import { useRobotManagement } from '../hooks/useRobotManagement';
import { useAlert } from '../hooks/useAlert';
import { useEnsureData } from '../hooks/useEnsureData';
import { Robot } from '../../domain/robot';
import { RobotGrid } from '../components/robot/robotGrid';
import { RobotDialog } from '../components/robot/dialog';
import { RobotConnectionDialog } from '../components/robot/robotConnectionDialog';
import { PageLayout } from '../components/layout/PageLayout';

export const RobotSelection: FC = () => {
  const navigate = useNavigate();
  const { setError, setSelectedRobot } = useAppContext();
  const { alert, showAlert } = useAlert();
  
  useEnsureData();

  const {
    robots,
    selectedRobot,
    handleDeleteRobot,
    handleSaveRobot,
    handleConnectToRobot,
    handleRobotConnectionTest,
  } = useRobotManagement();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [robotToEdit, setRobotToEdit] = useState<Robot | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [robotToConnect, setRobotToConnect] = useState<Robot | null>(null);
  const [connecting, setConnecting] = useState(false);

  const selectedRobotData = useMemo<Robot | undefined>(() => robots.find(bot => bot.id === selectedRobot), [robots, selectedRobot]);

  const handleAddRobot = () => {
    setRobotToEdit(null);
    setFormDialogOpen(true);
  };

  const handleEditRobot = (robot: Robot) => {
    setRobotToEdit(robot);
    setFormDialogOpen(true);
  };

  const handleRobotSelection = (robot: Robot) => {
    setRobotToConnect(robot);
    setConfirmDialogOpen(true);
  };

  const handleSaveRobotWithDialog = async (robot: Robot) => {
    const success = await handleSaveRobot(robot, !!robotToEdit);
    if (success) {
      setFormDialogOpen(false);
      setRobotToEdit(null);
    }
  };

  const handleConnectConfirmation = async () => {
    if (!robotToConnect) return;
    
    setConnecting(true);
    const success = await handleConnectToRobot(robotToConnect);
    setConnecting(false);
    
    setConfirmDialogOpen(false);
    setRobotToConnect(null);
    
    if (success) {
      showAlert(`Successfully connected to Robot ${robotToConnect.id}`, 'success');
    } else {
      showAlert(`Failed to connect to Robot ${robotToConnect.id}. Please check the robot and network.`, 'error');
    }
  };

  const handleCancelConfirmation = () => {
    setRobotToConnect(null);
    setConfirmDialogOpen(false);
  };


  const handleBack = () => navigate('/age-selection');
  const handleContinue = async () => {
    if (!selectedRobot) {
      setError('You have to select a robot to connect to in order to continue');
      return;
    }

    const isConnected = await window.electronAPI.robotConnection.checkConnection(selectedRobotData);
    if (isConnected) {
      navigate('/mode-selection');
    } else {
      setError('An error occured with the selected robot. Please try to reconnect to it.');
      setSelectedRobot(null);
    }
  };

  return (
    <PageLayout
      title="Select Your Robot"
      subtitle="Choose a robot from your saved list or add a new one. Make sure your robot is powered on and connected to the network."
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!selectedRobotData}
      maxWidth="lg"
      alert={alert}
    >
      <RobotGrid
        robots={robots}
        selectedRobotId={selectedRobot}
        onRobotSelect={handleRobotSelection}
        onRobotEdit={handleEditRobot}
        onRobotDelete={handleDeleteRobot}
        onAddRobot={handleAddRobot}
      />

      <RobotDialog
        open={formDialogOpen}
        robot={robotToEdit}
        onClose={() => setFormDialogOpen(false)}
        onSave={handleSaveRobotWithDialog}
        onTest={handleRobotConnectionTest}
      />

      <RobotConnectionDialog
        open={confirmDialogOpen}
        robot={robotToConnect}
        onConfirm={handleConnectConfirmation}
        onCancel={handleCancelConfirmation}
        loading={connecting}
      />
    </PageLayout>
  );
};
