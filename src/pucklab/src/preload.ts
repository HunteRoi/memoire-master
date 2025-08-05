// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  manageRobots: {
    loadRobots: () => ipcRenderer.invoke('manageRobots:loadRobots'),
    addRobot: (robot: any) =>
      ipcRenderer.invoke('manageRobots:addRobot', robot),
    updateRobot: (robot: any) =>
      ipcRenderer.invoke('manageRobots:updateRobot', robot),
    removeRobot: (robotId: string) =>
      ipcRenderer.invoke('manageRobots:removeRobot', robotId),
    clearRobots: () => ipcRenderer.invoke('manageRobots:clearRobots'),
    findRobotById: (robotId: string) =>
      ipcRenderer.invoke('manageRobots:findRobotById', robotId),
  },
  robotConnection: {
    connectToRobot: (robot: any) =>
      ipcRenderer.invoke('robotConnection:connectToRobot', robot),
    disconnectFromRobot: (robot: any) =>
      ipcRenderer.invoke('robotConnection:disconnectFromRobot', robot),
    checkConnection: (robot: any) =>
      ipcRenderer.invoke('robotConnection:checkConnection', robot),
  },
});
