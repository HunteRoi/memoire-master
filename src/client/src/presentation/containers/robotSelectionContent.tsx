import { type FC, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_PORT } from '../../domain/constants';
import type { Robot } from '../../domain/robot';
import {
  RobotDialog,
  type RobotDialogLabels,
} from '../components/robot/dialog';
import { RobotConnectionDialog } from '../components/robot/robotConnectionDialog';
import { RobotGrid } from '../components/robot/robotGrid';
import { useAppContext } from '../hooks/useAppContext';
import { useRobotManagement } from '../hooks/useRobotManagement';

export interface RobotSelectionContentRef {
  handleEnterKey: () => void;
}

interface RobotSelectionContentProps {
  onConnectionSuccess?: () => void;
}

export const RobotSelectionContent = forwardRef<RobotSelectionContentRef, RobotSelectionContentProps>(({ onConnectionSuccess }, ref) => {
  const { t } = useTranslation();
  const { setSelectedRobot, showAlert } = useAppContext();

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

  const handleAddRobot = () => {
    setRobotToEdit(null);
    setFormDialogOpen(true);
  };

  const handleEditRobot = (robot: Robot) => {
    setRobotToEdit(robot);
    setFormDialogOpen(true);
  };

  const handleRobotSelection = (robot: Robot) => {
    setSelectedRobot(robot.id);
  };

  const handleRobotConnect = (robot: Robot) => {
    setRobotToConnect(robot);
    setConfirmDialogOpen(true);
  };

  const handleEnterKey = () => {
    if (!selectedRobot) {
      showAlert(
        t('alerts.noRobotSelected', 'You have to select a robot to connect to in order to continue'),
        'error'
      );
      return;
    }

    const robotConnected = isRobotConnected(selectedRobot);
    if (!robotConnected) {
      // Find the selected robot data and prompt for connection
      const selectedRobotData = robots.find(robot => robot.id === selectedRobot);
      if (selectedRobotData) {
        setRobotToConnect(selectedRobotData);
        setConfirmDialogOpen(true);
      }
    }
    // If robot is already connected, let the page handle navigation
  };

  useImperativeHandle(ref, () => ({
    handleEnterKey,
  }));

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
      // Call success callback if provided (for navigation)
      onConnectionSuccess?.();
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

  const robotDialogLabels: RobotDialogLabels = useMemo(
    () => ({
      editRobot: t('robot.editRobot'),
      addNewRobot: t('robot.addNewRobot'),
      ipAddress: t('robot.ipAddress'),
      robotIdWillBe: t('robot.robotIdWillBe', 'Robot ID will be: {{id}}'),
      port: t('robot.port'),
      portDescription: t(
        'robot.portDescription',
        `Enter the port number (default: ${DEFAULT_PORT})`
      ),
      testingConnection: t('robot.testingConnection', 'Testing Connection...'),
      testConnection: t('robot.testConnection'),
      connectionSuccessWithId: t(
        'robot.connectionSuccessWithId',
        'Connection successful! Robot {{id}} is reachable.'
      ),
      connectionFailedDetails: t(
        'robot.connectionFailedDetails',
        'Connection failed. Please check the IP address and port, and make sure the robot is powered on and connected to the network.'
      ),
      cancel: t('common.cancel'),
      updateRobot: t('robot.updateRobot', 'Update Robot'),
      addRobot: t('robot.addRobot', 'Add Robot'),
    }),
    [t]
  );

  const robotConnectionDialogLabels = useMemo(
    () => ({
      title: t('robot.connectToRobotName', 'Connect to {{name}}', {
        name: robotToConnect?.name || '',
      }),
      confirmMessage: t(
        'robot.connectConfirm',
        'Are you sure you want to connect to {{name}}?',
        { name: robotToConnect?.name || '' }
      ),
      cancel: t('common.cancel'),
      connect: t('common.connect'),
      connecting: t('robot.connecting', 'Connecting...'),
    }),
    [t, robotToConnect]
  );

  const addRobotCardLabel = useMemo(() => t('robot.addNewRobot'), [t]);

  const robotCardLabels = useMemo(
    () => ({
      connect: (robotName: string) =>
        t('robot.card.connect', `Connect to robot ${robotName}`, { name: robotName }),
      disconnect: (robotName: string) =>
        t('robot.card.disconnect', `Disconnect from robot ${robotName}`, { name: robotName }),
      edit: (robotName: string) =>
        t('robot.card.edit', `Edit robot ${robotName}`, { name: robotName }),
      delete: (robotName: string) =>
        t('robot.card.delete', `Delete robot ${robotName}`, {
          name: robotName,
        }),
      connected: t('robot.connected'),
      disconnected: t('robot.disconnected'),
    }),
    [t]
  );

  return (
    <>
      <RobotGrid
        robots={robots}
        selectedRobotId={selectedRobot}
        isRobotConnected={isRobotConnected}
        onRobotSelect={handleRobotSelection}
        onRobotConnect={handleRobotConnect}
        onRobotEdit={handleEditRobot}
        onRobotDelete={handleDeleteRobot}
        onRobotDisconnect={handleDisconnectRobot}
        onAddRobot={handleAddRobot}
        robotCardLabels={robotCardLabels}
        addRobotCardLabel={addRobotCardLabel}
      />

      <RobotDialog
        open={formDialogOpen}
        robot={robotToEdit}
        onClose={() => setFormDialogOpen(false)}
        onSave={handleSaveRobotWithDialog}
        onTest={handleRobotConnectionTest}
        labels={robotDialogLabels}
        ipFieldDisabled={!!robotToEdit}
      />

      {robotToConnect && (
        <RobotConnectionDialog
          open={confirmDialogOpen}
          onConfirm={handleConnectConfirmation}
          onCancel={handleCancelConfirmation}
          loading={connecting}
          labels={robotConnectionDialogLabels}
        />
      )}
    </>
  );
});
