import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';

/**
 * Manages the Python Code Viewer window and its IPC handlers
 */
export class PythonCodeViewerManager {
  private pythonCodeViewerWindow: BrowserWindow | null = null;
  private currentPythonCode: string = '';

  constructor() {
    this.registerIpcHandlers();
  }

  /**
   * Register all IPC handlers for Python Code Viewer operations
   */
  private registerIpcHandlers(): void {
    ipcMain.handle('pythonCodeViewer:openWindow', async (_, code: string, title?: string) => {
      return await this.openWindow(code, title);
    });

    ipcMain.handle('pythonCodeViewer:updateCode', async (_, code: string) => {
      return await this.updateCode(code);
    });

    ipcMain.handle('pythonCodeViewer:closeWindow', async () => {
      return await this.closeWindow();
    });
  }

  /**
   * Open or focus the Python Code Viewer window
   */
  private async openWindow(code: string, title?: string): Promise<boolean> {
    // Store the current code
    this.currentPythonCode = code;

    // If window already exists, just update the code and focus
    if (this.pythonCodeViewerWindow && !this.pythonCodeViewerWindow.isDestroyed()) {
      this.pythonCodeViewerWindow.webContents.executeJavaScript(`
        window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(code)} }));
      `);
      this.pythonCodeViewerWindow.focus();
      return true;
    }

    // Create new Python code viewer window
    this.pythonCodeViewerWindow = new BrowserWindow({
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

    // Load the HTML file
    this.pythonCodeViewerWindow.loadFile(path.join(__dirname, '../static/pythonCodeViewer.html'));

    // Show window when ready and send initial code
    this.pythonCodeViewerWindow.once('ready-to-show', () => {
      this.pythonCodeViewerWindow?.show();
      this.pythonCodeViewerWindow?.webContents.executeJavaScript(`
        window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(this.currentPythonCode)} }));
      `);
    });

    // Clean up reference when window is closed
    this.pythonCodeViewerWindow.on('closed', () => {
      this.pythonCodeViewerWindow = null;
    });

    return true;
  }

  /**
   * Update the Python code in the viewer window
   */
  private async updateCode(code: string): Promise<boolean> {
    this.currentPythonCode = code;
    if (this.pythonCodeViewerWindow && !this.pythonCodeViewerWindow.isDestroyed()) {
      this.pythonCodeViewerWindow.webContents.executeJavaScript(`
        window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(code)} }));
      `);
    }
    return true;
  }

  /**
   * Close the Python Code Viewer window
   */
  private async closeWindow(): Promise<boolean> {
    if (this.pythonCodeViewerWindow && !this.pythonCodeViewerWindow.isDestroyed()) {
      this.pythonCodeViewerWindow.close();
      this.pythonCodeViewerWindow = null;
    }
    return true;
  }
}