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
    isRobotConnected,
    handleDeleteRobot,
    handleSaveRobot,
    handleConnectToRobot,
    handleDisconnectFromRobot,
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
    const robotConnected = isRobotConnected(robot.id);
    
    if (robotConnected) {
      // Robot is already connected, just select it
      setSelectedRobot(robot.id);
      showAlert(`Robot ${robot.id} is already connected`, 'info');
    } else {
      // Robot not connected, show connection dialog
      setRobotToConnect(robot);
      setConfirmDialogOpen(true);
    }
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

  const handleDisconnectRobot = async (robot: Robot) => {
    const success = await handleDisconnectFromRobot(robot);
    if (success) {
      showAlert(`Disconnected from Robot ${robot.id}`, 'info');
    } else {
      showAlert(`Failed to disconnect from Robot ${robot.id}`, 'error');
    }
  };


  const handleBack = () => navigate('/age-selection');
  const handleContinue = async () => {
    if (!selectedRobot) {
      setError('You have to select a robot to connect to in order to continue');
      return;
    }

    const robotConnected = isRobotConnected(selectedRobot);
    if (robotConnected) {
      navigate('/mode-selection');
    } else {
      setError('The selected robot is not connected. Please connect to it first.');
      setSelectedRobot(null);
    }
  };

  return (
    <PageLayout
      title="Select Your Robot"
      subtitle="Choose a robot from your saved list or add a new one. Make sure your robot is powered on and connected to the network."
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!selectedRobotData || !isRobotConnected(selectedRobot || '')}
      maxWidth="lg"
      alert={alert}
    >
      <RobotGrid
        robots={robots}
        selectedRobotId={selectedRobot}
        isRobotConnected={isRobotConnected}
        onRobotSelect={handleRobotSelection}
        onRobotEdit={handleEditRobot}
        onRobotDelete={handleDeleteRobot}
        onRobotDisconnect={handleDisconnectRobot}
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
