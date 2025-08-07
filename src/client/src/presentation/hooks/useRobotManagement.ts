import { isSuccess, type Result } from '../../domain/result';
import { Robot, type RobotConfig } from '../../domain/robot';
import { useAppContext } from './useAppContext';

export const useRobotManagement = () => {
  const {
    robots,
    setRobotsList,
    selectedRobot,
    setSelectedRobot,
    addConnectedRobot,
    removeConnectedRobot,
    isRobotConnected,
    setError,
    setLoading,
  } = useAppContext();

  const handleDeleteRobot = async (robotId: string) => {
    const result = await window.electronAPI.manageRobots.removeRobot(robotId);
    if (isSuccess(result)) {
      setRobotsList(
        result.data.map(robot => new Robot(robot.ipAddress, robot.port))
      );
    } else {
      console.error(result.error);
      setError('Failed to delete the robot');
    }
  };

  const handleSaveRobot = async (robot: Robot, isEdit: boolean) => {
    let result: Result<RobotConfig[]>;
    if (isEdit) {
      result = await window.electronAPI.manageRobots.updateRobot(robot);
    } else {
      result = await window.electronAPI.manageRobots.addRobot(robot);
    }

    if (isSuccess(result)) {
      setRobotsList(
        result.data.map(robot => new Robot(robot.ipAddress, robot.port))
      );
      return true;
    } else {
      console.error('Failed to save robot:', result.error);
      setError(`Failed to save ${robot.name}`);
      return false;
    }
  };

  const handleConnectToRobot = async (robot: Robot) => {
    setLoading(true);
    const result =
      await window.electronAPI.robotConnection.connectToRobot(robot);
    setLoading(false);

    if (isSuccess(result)) {
      addConnectedRobot(robot.id);
      setSelectedRobot(robot.id);
      return true;
    } else {
      console.error('Could not connect to robot', result.error);
      setError('Could not connect to this robot');
      return false;
    }
  };

  const handleDisconnectFromRobot = async (robot: Robot) => {
    const result =
      await window.electronAPI.robotConnection.disconnectFromRobot(robot);
    if (isSuccess(result)) {
      removeConnectedRobot(robot.id);
      if (selectedRobot === robot.id) {
        setSelectedRobot(null);
      }
      return true;
    } else {
      console.error('Could not disconnect from robot', result.error);
      setError('Could not disconnect from this robot');
      return false;
    }
  };

  const handleRobotConnectionTest = async (robot: Robot): Promise<boolean> => {
    try {
      const result =
        await window.electronAPI.robotConnection.connectToRobot(robot);
      if (isSuccess(result)) {
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
  };

  return {
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
  };
};
