import { Robot } from './robot';
import { Result } from './result';

export interface ElectronAPI {
  manageRobots: {
    loadRobots: () => Promise<Result<Robot[]>>;
    addRobot: (robot: Robot) => Promise<Result<Robot[]>>;
    updateRobot: (robot: Robot) => Promise<Result<Robot[]>>;
    removeRobot: (robotId: string) => Promise<Result<Robot[]>>;
    clearRobots: () => Promise<Result<Robot[]>>;
    findRobotById: (robotId: string) => Promise<Result<Robot | null>>;
  };
  robotConnection: {
    connectToRobot: (robot: Robot) => Promise<Result<Robot>>;
    disconnectFromRobot: (robot: Robot) => Promise<Result<Robot>>;
    checkConnection: (robot: Robot) => Promise<Result<boolean>>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
