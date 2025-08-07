// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

import type { RobotConfig } from './domain/robot';
import type { RobotFeedback } from './domain/RobotFeedback';

contextBridge.exposeInMainWorld('electronAPI', {
  app: {
    isPackaged: () => ipcRenderer.invoke('app:isPackaged'),
  },
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
    subscribeToFeedback: (robotConfig: RobotConfig) =>
      ipcRenderer.invoke('robotFeedback:subscribe', robotConfig),
    unsubscribeFromFeedback: (robotConfig: RobotConfig) =>
      ipcRenderer.invoke('robotFeedback:unsubscribe', robotConfig),
    sendCommand: (robotConfig: RobotConfig, command: string) =>
      ipcRenderer.invoke('robotFeedback:sendCommand', robotConfig, command),
    onFeedback: (callback: (feedback: RobotFeedback) => void) =>
      ipcRenderer.on('robotFeedback:message', (_, feedback) =>
        callback(feedback)
      ),
    removeFeedbackListener: () =>
      ipcRenderer.removeAllListeners('robotFeedback:message'),
  },
  pythonCodeViewer: {
    openWindow: (code: string, title?: string) =>
      ipcRenderer.invoke('pythonCodeViewer:openWindow', code, title),
    updateCode: (code: string) =>
      ipcRenderer.invoke('pythonCodeViewer:updateCode', code),
    closeWindow: () => ipcRenderer.invoke('pythonCodeViewer:closeWindow'),
  },
});
