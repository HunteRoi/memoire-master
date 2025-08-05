import type { RobotConfig } from './robot';
import type { Result } from './result';

export interface ElectronAPI {
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
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
