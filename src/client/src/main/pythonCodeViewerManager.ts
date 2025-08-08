import * as path from 'node:path';
import { BrowserWindow, ipcMain } from 'electron';

/**
 * A wrapper for the Python code viewer management methods
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Manager pattern for Python code viewer operations
export class PythonCodeViewerManager {
  private static pythonCodeViewerWindow: BrowserWindow | null = null;
  private static currentPythonCode: string = '';

  public static registerPythonCodeViewerIpcHandlers(): void {
    ipcMain.handle(
      'pythonCodeViewer:openWindow',
      async (_, code: string, title?: string) => {
        return await PythonCodeViewerManager.openWindow(code, title);
      }
    );

    ipcMain.handle('pythonCodeViewer:updateCode', async (_, code: string) => {
      return await PythonCodeViewerManager.updateCode(code);
    });

    ipcMain.handle('pythonCodeViewer:closeWindow', async () => {
      return await PythonCodeViewerManager.closeWindow();
    });
  }

  private static async openWindow(
    code: string,
    title?: string
  ): Promise<boolean> {
    PythonCodeViewerManager.currentPythonCode = code;

    if (
      PythonCodeViewerManager.pythonCodeViewerWindow &&
      !PythonCodeViewerManager.pythonCodeViewerWindow.isDestroyed()
    ) {
      PythonCodeViewerManager.pythonCodeViewerWindow.webContents.executeJavaScript(`
        window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(code)} }));
      `);
      PythonCodeViewerManager.pythonCodeViewerWindow.focus();
      return true;
    }

    PythonCodeViewerManager.pythonCodeViewerWindow = new BrowserWindow({
      width: 900,
      height: 700,
      title: title || 'Generated Python Code',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/index.js'),
      },
      parent: BrowserWindow.getFocusedWindow() || undefined,
      modal: false,
      show: false,
      icon: path.join(__dirname, '../assets/icon.png'), // Add app icon if available
    });

    PythonCodeViewerManager.pythonCodeViewerWindow.loadFile(
      path.join(__dirname, '../static/pythonCodeViewer.html')
    );

    PythonCodeViewerManager.pythonCodeViewerWindow.once('ready-to-show', () => {
      PythonCodeViewerManager.pythonCodeViewerWindow?.show();
      PythonCodeViewerManager.pythonCodeViewerWindow?.webContents.executeJavaScript(`
        window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(PythonCodeViewerManager.currentPythonCode)} }));
      `);
    });

    PythonCodeViewerManager.pythonCodeViewerWindow.on('closed', () => {
      PythonCodeViewerManager.pythonCodeViewerWindow = null;
    });

    return true;
  }

  private static async updateCode(code: string): Promise<boolean> {
    PythonCodeViewerManager.currentPythonCode = code;
    if (
      PythonCodeViewerManager.pythonCodeViewerWindow &&
      !PythonCodeViewerManager.pythonCodeViewerWindow.isDestroyed()
    ) {
      PythonCodeViewerManager.pythonCodeViewerWindow.webContents.executeJavaScript(`
        window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(code)} }));
      `);
    }
    return true;
  }

  private static async closeWindow(): Promise<boolean> {
    if (
      PythonCodeViewerManager.pythonCodeViewerWindow &&
      !PythonCodeViewerManager.pythonCodeViewerWindow.isDestroyed()
    ) {
      PythonCodeViewerManager.pythonCodeViewerWindow.close();
      PythonCodeViewerManager.pythonCodeViewerWindow = null;
    }
    return true;
  }
}
