import { Robot } from "./robot";

export interface ElectronAPI {
  manageRobots: {
    loadRobots: () => Promise<Robot[]>;
    addRobot: (robot: Robot) => Promise<Robot[]>;
    updateRobot: (robot: Robot) => Promise<Robot[]>;
    removeRobot: (robotId: string) => Promise<Robot[]>;
    clearRobots: () => Promise<Robot[]>;
    findRobotById: (robotId: string) => Promise<Robot | null>;
  };
  robotConnection: {
    connectToRobot: (robot: Robot) => Promise<Robot>;
    disconnectFromRobot: (robot: Robot) => Promise<Robot>;
    checkConnection: (robot: Robot) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
