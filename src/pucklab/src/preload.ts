// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

import { RobotConfig } from './domain/robot';

contextBridge.exposeInMainWorld('electronAPI', {
  manageRobots: {
    loadRobots: () => ipcRenderer.invoke('manageRobots:loadRobots'),
    addRobot: (robot: RobotConfig) =>
      ipcRenderer.invoke('manageRobots:addRobot', robot),
    updateRobot: (robot: RobotConfig) =>
      ipcRenderer.invoke('manageRobots:updateRobot', robot),
    removeRobot: (robotId: string) =>
      ipcRenderer.invoke('manageRobots:removeRobot', robotId),
    clearRobots: () => ipcRenderer.invoke('manageRobots:clearRobots'),
    findRobotById: (robotId: string) =>
      ipcRenderer.invoke('manageRobots:findRobotById', robotId),
  },
  robotConnection: {
    connectToRobot: (robot: RobotConfig) =>
      ipcRenderer.invoke('robotConnection:connectToRobot', robot),
    disconnectFromRobot: (robot: RobotConfig) =>
      ipcRenderer.invoke('robotConnection:disconnectFromRobot', robot),
    checkConnection: (robot: RobotConfig) =>
      ipcRenderer.invoke('robotConnection:checkConnection', robot),
  },
});
