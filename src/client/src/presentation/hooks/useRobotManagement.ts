import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { isSuccess } from '../../domain/result';
import type { Robot, RobotConfig } from '../../domain/robot';
import { useAppContext } from './useAppContext';

export const useRobotManagement = () => {
  const { t } = useTranslation();
  const {
    robots,
    setRobotsList,
    selectedRobot,
    setSelectedRobot,
    addConnectedRobot,
    removeConnectedRobot,
    isRobotConnected,
    transformRobotData,
    setError,
    setLoading,
  } = useAppContext();

  const handleDeleteRobot = useCallback(
    async (robotId: string) => {
      try {
        const result =
          await window.electronAPI.manageRobots.removeRobot(robotId);
        if (isSuccess(result)) {
          setRobotsList(transformRobotData(result.data as RobotConfig[]));
        } else {
          console.error('Delete robot failed:', result.error);
          setError(t('errors.robotDeleteFailed'));
        }
      } catch (error) {
        console.error('Delete robot error:', error);
        setError(t('errors.robotDeleteFailed'));
      }
    },
    [transformRobotData, setRobotsList, setError]
  );

  const handleSaveRobot = useCallback(
    async (robot: Robot, isEdit: boolean): Promise<boolean> => {
      try {
        const result = isEdit
          ? await window.electronAPI.manageRobots.updateRobot(robot)
          : await window.electronAPI.manageRobots.addRobot(robot);

        if (isSuccess(result)) {
          setRobotsList(transformRobotData(result.data as RobotConfig[]));
          return true;
        } else {
          console.error('Save robot failed:', result.error);
          setError(t('errors.robotSaveFailed', { robotName: robot.name }));
          return false;
        }
      } catch (error) {
        console.error('Save robot error:', error);
        setError(t('errors.robotSaveFailed', { robotName: robot.name }));
        return false;
      }
    },
    [transformRobotData, setRobotsList, setError]
  );

  const handleConnectToRobot = useCallback(
    async (robot: Robot): Promise<boolean> => {
      try {
        setLoading(true);
        const result =
          await window.electronAPI.robotConnection.connectToRobot(robot);

        if (isSuccess(result)) {
          addConnectedRobot(robot.id);
          setSelectedRobot(robot.id);
          return true;
        } else {
          console.error('Connect to robot failed:', result.error);
          setError(t('errors.robotConnectFailed'));
          return false;
        }
      } catch (error) {
        console.error('Connect to robot error:', error);
        setError(t('errors.robotConnectFailed'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, addConnectedRobot, setSelectedRobot, setError]
  );

  const handleDisconnectFromRobot = useCallback(
    async (robot: Robot): Promise<boolean> => {
      try {
        const result =
          await window.electronAPI.robotConnection.disconnectFromRobot(robot);
        if (isSuccess(result)) {
          removeConnectedRobot(robot.id);
          if (selectedRobot === robot.id) {
            setSelectedRobot(null);
          }
          return true;
        } else {
          console.error('Disconnect from robot failed:', result.error);
          setError(t('errors.robotDisconnectFailed'));
          return false;
        }
      } catch (error) {
        console.error('Disconnect from robot error:', error);
        setError(t('errors.robotDisconnectFailed'));
        return false;
      }
    },
    [removeConnectedRobot, selectedRobot, setSelectedRobot, setError]
  );

  const handleRobotConnectionTest = useCallback(
    async (robot: Robot): Promise<boolean> => {
      try {
        const result =
          await window.electronAPI.robotConnection.connectToRobot(robot);
        if (isSuccess(result)) {
          // Clean up test connection
          await window.electronAPI.robotConnection.disconnectFromRobot(
            result.data
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error('Robot connection test failed:', error);
        return false;
      }
    },
    []
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // State
      robots,
      selectedRobot,
      isRobotConnected,

      // Actions
      handleDeleteRobot,
      handleSaveRobot,
      handleConnectToRobot,
      handleDisconnectFromRobot,
      handleRobotConnectionTest,
    }),
    [
      robots,
      selectedRobot,
      isRobotConnected,
      handleDeleteRobot,
      handleSaveRobot,
      handleConnectToRobot,
      handleDisconnectFromRobot,
      handleRobotConnectionTest,
    ]
  );
};
