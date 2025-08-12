import { app, type BrowserWindow, ipcMain } from 'electron';

import { getLogger } from './infrastructure/logging/logger';
import { ApplicationMenuManager } from './menuManager';
import { PythonCodeViewerManager } from './pythonCodeViewerManager';
import { RobotIpcHandlersManager } from './robotIpcHandlersManager';

let mainWindow: BrowserWindow | null = null;

function setupAppLifecycle(): void {
  app.whenReady().then(() => {
    ipcMain.handle('app:isPackaged', () => {
      return app.isPackaged;
    });

    RobotIpcHandlersManager.registerRobotIpcHandlers();
    PythonCodeViewerManager.registerPythonCodeViewerIpcHandlers();
  });

  app.on('browser-window-created', (_, window) => {
    if (!mainWindow) {
      mainWindow = window;
      const logger = getLogger();
      ApplicationMenuManager.createApplicationMenu(window, logger);
      logger.info('Main window created and menu initialized');
    }
  });
}

setupAppLifecycle();
