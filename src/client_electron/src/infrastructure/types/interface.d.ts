export type ElectronAPI = {
  readRobotsConfig: () => Promise<SerializedRobot[]>;
  writeRobotsConfig: (robotsData: SerializedRobot[]) => Promise<void>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
