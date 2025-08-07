import { ipcMain, app } from 'electron';

/**
 * Registers general application IPC handlers
 */
export function registerAppIpcHandlers(): void {
  ipcMain.handle('app:isPackaged', () => {
    return app.isPackaged;
  });
}