import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../hooks/useAppContext';
import { useRobotManagement } from '../hooks/useRobotManagement';
import { Robot } from '../../domain/robot';
import { RobotGrid } from '../components/robot/robotGrid';
import { RobotDialog } from '../components/robot/dialog';
import { RobotConnectionDialog } from '../components/robot/robotConnectionDialog';

export const RobotSelectionContent: FC = () => {
  const { t } = useTranslation();
  const { setError, setSelectedRobot, showAlert } = useAppContext();

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

  const selectedRobotData = useMemo<Robot | undefined>(
    () => robots.find(bot => bot.id === selectedRobot),
    [robots, selectedRobot]
  );

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
      setSelectedRobot(robot.id);
      showAlert(
        t('alerts.robotAlreadyConnected', { robotId: robot.id }),
        'info'
      );
    } else {
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
      showAlert(
        t('alerts.robotConnectedSuccess', { robotId: robotToConnect.id }),
        'success'
      );
    } else {
      showAlert(
        t('alerts.robotConnectionFailed', { robotId: robotToConnect.id }),
        'error'
      );
    }
  };

  const handleCancelConfirmation = () => {
    setRobotToConnect(null);
    setConfirmDialogOpen(false);
  };

  const handleDisconnectRobot = async (robot: Robot) => {
    const success = await handleDisconnectFromRobot(robot);
    if (success) {
      showAlert(
        t('alerts.robotDisconnectedSuccess', { robotId: robot.id }),
        'info'
      );
    } else {
      showAlert(
        t('alerts.robotDisconnectionFailed', { robotId: robot.id }),
        'error'
      );
    }
  };

  return (
    <>
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

      {robotToEdit && (
        <RobotDialog
          open={formDialogOpen}
          robot={robotToEdit}
          onClose={() => setFormDialogOpen(false)}
          onSave={handleSaveRobotWithDialog}
          onTest={handleRobotConnectionTest}
        />
      )}

      {robotToConnect && (
        <RobotConnectionDialog
          open={confirmDialogOpen}
          robot={robotToConnect}
          onConfirm={handleConnectConfirmation}
          onCancel={handleCancelConfirmation}
          loading={connecting}
        />
      )}
    </>
  );
};
