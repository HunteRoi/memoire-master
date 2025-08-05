// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

import type { ElectronAPI } from './domain/interface';

type SerializedRobot = {
  ipAddress: string;
  port: number;
};

contextBridge.exposeInMainWorld('electronAPI', {
  readRobotsConfig: (): Promise<SerializedRobot[]> => ipcRenderer.invoke('readRobotsConfig'),
  writeRobotsConfig: (robotsData: SerializedRobot[]) => ipcRenderer.invoke('writeRobotsConfig', robotsData),
} as ElectronAPI);
