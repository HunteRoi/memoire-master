import { ipcMain, BrowserWindow } from 'electron';

import { Container } from './container';
import type { RobotConfig } from '../domain/robot';
import type { RobotFeedback } from './application/interfaces/robotCommunicationService';
import { Robot } from '../domain/robot';
import { isSuccess } from '../domain/result';

/**
 * Registers IPC handlers for robot management and connection operations
 */
export function registerRobotIpcHandlers(): void {
  const container = Container.getInstance();

  // Store active feedback subscriptions
  const feedbackSubscriptions = new Map<string, Robot>();

  // Robot Management Handlers
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

  // Robot Connection Handlers
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

  // Robot Feedback Handlers
  ipcMain.handle(
    'robotFeedback:subscribe',
    async (event, robotConfig: RobotConfig) => {
      const robotKey = `${robotConfig.ipAddress}:${robotConfig.port}`;

      // Create feedback callback that sends data to renderer
      const feedbackCallback = (feedback: RobotFeedback) => {
        const mainWindow =
          BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('robotFeedback:message', feedback);
        }
      };

      // Subscribe to feedback through the use case
      const result = await container.robotConnectionUseCase.subscribeToFeedback(
        robotConfig,
        feedbackCallback
      );
      if (isSuccess(result)) {
        const robot = new Robot(robotConfig.ipAddress, robotConfig.port);
        feedbackSubscriptions.set(robotKey, robot);
        console.log(`📻 Subscribed to feedback for robot ${robot.id}`);
        return true;
      } else {
        console.error(`❌ Failed to subscribe to feedback: ${result.error}`);
        return false;
      }
    }
  );

  ipcMain.handle(
    'robotFeedback:unsubscribe',
    async (_, robotConfig: RobotConfig) => {
      const robotKey = `${robotConfig.ipAddress}:${robotConfig.port}`;

      // Unsubscribe from feedback through the use case
      const result =
        await container.robotConnectionUseCase.unsubscribeFromFeedback(
          robotConfig
        );
      if (isSuccess(result)) {
        feedbackSubscriptions.delete(robotKey);
        const robot = new Robot(robotConfig.ipAddress, robotConfig.port);
        console.log(`📻 Unsubscribed from feedback for robot ${robot.id}`);
        return true;
      } else {
        console.error(
          `❌ Failed to unsubscribe from feedback: ${result.error}`
        );
        return false;
      }
    }
  );

  ipcMain.handle(
    'robotFeedback:sendCommand',
    async (_, robotConfig: RobotConfig, command: string) => {
      const robot = new Robot(robotConfig.ipAddress, robotConfig.port);

      try {
        const result = await container.robotConnectionUseCase.sendCommand(
          robotConfig,
          command
        );

        if (isSuccess(result)) {
          // Send command execution feedback
          const feedback: RobotFeedback = {
            robotId: robot.id,
            timestamp: Date.now(),
            type: 'success',
            message: `Command executed: ${command}`,
            data: result.data,
          };

          container.robotConnectionUseCase.sendFeedback(feedback);
          return result.data;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        // Send error feedback
        const feedback: RobotFeedback = {
          robotId: robot.id,
          timestamp: Date.now(),
          type: 'error',
          message: `Command failed: ${command} - ${error}`,
          data: { error: error.toString() },
        };

        container.robotConnectionUseCase.sendFeedback(feedback);
        throw error;
      }
    }
  );
}
