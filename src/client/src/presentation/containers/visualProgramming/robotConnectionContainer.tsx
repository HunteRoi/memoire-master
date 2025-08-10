import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useAppContext } from '../../hooks/useAppContext';
import type { Robot } from '../../../domain/robot';

export interface RobotConnectionContextType {
  selectedRobot: string | null;
  selectedRobotData: Robot | undefined;
  robots: Robot[];
  isRobotConnected: (robotId: string) => boolean;
  hasConnectedRobot: boolean;
  canExecuteScript: boolean;
  showAlert: (message: string, severity: 'error' | 'warning' | 'info' | 'success') => void;
}

const RobotConnectionContext = createContext<RobotConnectionContextType | null>(null);

export const useRobotConnection = (): RobotConnectionContextType => {
  const context = useContext(RobotConnectionContext);
  if (!context) {
    throw new Error('useRobotConnection must be used within a RobotConnectionContainer');
  }
  return context;
};

interface RobotConnectionContainerProps {
  children: ReactNode;
  nodes: any[]; // For canExecuteScript computation
}

export const RobotConnectionContainer: React.FC<RobotConnectionContainerProps> = ({
  children,
  nodes
}) => {
  const { selectedRobot, isRobotConnected, robots, showAlert } = useAppContext();

  // Computed values
  const selectedRobotData = useMemo(
    () => robots.find(robot => robot.id === selectedRobot),
    [robots, selectedRobot]
  );

  const hasConnectedRobot = !!selectedRobot && isRobotConnected(selectedRobot);
  const canExecuteScript = hasConnectedRobot && nodes.length > 0;

  const contextValue = useMemo<RobotConnectionContextType>(
    () => ({
      selectedRobot,
      selectedRobotData,
      robots,
      isRobotConnected,
      hasConnectedRobot,
      canExecuteScript,
      showAlert,
    }),
    [
      selectedRobot,
      selectedRobotData,
      robots,
      isRobotConnected,
      hasConnectedRobot,
      canExecuteScript,
      showAlert,
    ]
  );

  return (
    <RobotConnectionContext.Provider value={contextValue}>
      {children}
    </RobotConnectionContext.Provider>
  );
};
