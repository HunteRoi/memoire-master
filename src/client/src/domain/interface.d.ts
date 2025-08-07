import type { RobotConfig } from './robot';
import type { Result } from './result';
import type { RobotFeedback } from '../main/application/interfaces/robotCommunicationService';

export interface ElectronAPI {
  app: {
    isPackaged: () => Promise<boolean>;
  };
  manageRobots: {
    loadRobots: () => Promise<Result<RobotConfig[]>>;
    addRobot: (robot: RobotConfig) => Promise<Result<RobotConfig[]>>;
    updateRobot: (robot: RobotConfig) => Promise<Result<RobotConfig[]>>;
    removeRobot: (robotId: string) => Promise<Result<RobotConfig[]>>;
    clearRobots: () => Promise<Result<RobotConfig[]>>;
    findRobotById: (robotId: string) => Promise<Result<RobotConfig>>;
  };
  robotConnection: {
    connectToRobot: (robot: RobotConfig) => Promise<Result<RobotConfig>>;
    disconnectFromRobot: (robot: RobotConfig) => Promise<Result<RobotConfig>>;
    checkConnection: (robot: RobotConfig) => Promise<Result<boolean>>;
    subscribeToFeedback: (robotConfig: RobotConfig) => Promise<boolean>;
    unsubscribeFromFeedback: (robotConfig: RobotConfig) => Promise<boolean>;
    sendCommand: (robotConfig: RobotConfig, command: string) => Promise<unknown>;
    onFeedback: (callback: (feedback: RobotFeedback) => void) => void;
    removeFeedbackListener: () => void;
  };
  pythonCodeViewer: {
    openWindow: (code: string, title?: string) => Promise<boolean>;
    updateCode: (code: string) => Promise<boolean>;
    closeWindow: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
