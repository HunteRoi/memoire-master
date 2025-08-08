import { app, type BrowserWindow, ipcMain } from 'electron';

import { getLogger } from './infrastructure/logging/logger';
import { ApplicationMenuManager } from './menuManager';
import { PythonCodeViewerManager } from './pythonCodeViewerManager';
import { RobotIpcHandlersManager } from './robotIpcHandlersManager';

let mainWindow: BrowserWindow | null = null;

/**
 * Set up application lifecycle event handlers
 */
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
      // only triggered once, for the first Window
      mainWindow = window;
      const logger = getLogger();
      ApplicationMenuManager.createApplicationMenu(window, logger);
      logger.info('Main window created and menu initialized');
    }
  });
}

setupAppLifecycle();
