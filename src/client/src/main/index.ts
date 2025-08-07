import { app, ipcMain } from 'electron';

import { Container } from './container';
import type { RobotConfig } from '../domain/robot';

const container = Container.getInstance();

ipcMain.handle('app:isPackaged', () => {
  return app.isPackaged;
});

ipcMain.handle('manageRobots:loadRobots', async () => {
  return await container.manageRobotsUseCase.loadRobots();
});

ipcMain.handle('manageRobots:addRobot', async (_, robot: RobotConfig) => {
  return await container.manageRobotsUseCase.addRobot(robot);
});

ipcMain.handle('manageRobots:updateRobot', async (_, robot: RobotConfig) => {
  return await container.manageRobotsUseCase.updateRobot(robot);
});

ipcMain.handle('manageRobots:removeRobot', async (_, robotId: string) => {
  return await container.manageRobotsUseCase.removeRobot(robotId);
});

ipcMain.handle('manageRobots:clearRobots', async () => {
  return await container.manageRobotsUseCase.clearRobots();
});

ipcMain.handle('manageRobots:findRobotById', async (_, robotId: string) => {
  return await container.manageRobotsUseCase.findRobotById(robotId);
});

ipcMain.handle(
  'robotConnection:connectToRobot',
  async (_, robot: RobotConfig) => {
    return await container.robotConnectionUseCase.connectToRobot(robot);
  }
);

ipcMain.handle(
  'robotConnection:disconnectFromRobot',
  async (_, robot: RobotConfig) => {
    return await container.robotConnectionUseCase.disconnectFromRobot(robot);
  }
);

ipcMain.handle(
  'robotConnection:checkConnection',
  async (_, robot: RobotConfig) => {
    return await container.robotConnectionUseCase.checkConnection(robot);
  }
);
