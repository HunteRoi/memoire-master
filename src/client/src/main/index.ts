import { app, ipcMain, BrowserWindow, Menu, MenuItem } from 'electron';
import * as path from 'path';

import { Container } from './container';
import type { RobotConfig } from '../domain/robot';

const container = Container.getInstance();

// Keep track of the Python code viewer window and current code
let pythonCodeViewerWindow: BrowserWindow | null = null;
let currentPythonCode: string = '';
let mainWindow: BrowserWindow | null = null;

// Create application menu
function createApplicationMenu() {
  const menu = Menu.buildFromTemplate(Menu.getApplicationMenu()?.items.map(item => ({
    ...item,
    submenu: item.submenu
  })) || []);

  // Add Settings to File menu
  const fileMenu = menu.items.find(item => item.label === 'File');
  if (fileMenu && fileMenu.submenu) {
    fileMenu.submenu.insert(0, new MenuItem({
      label: 'Settings',
      accelerator: 'CmdOrCtrl+,',
      click: () => {
        mainWindow?.webContents.send('menu:openSettings');
      }
    }));
    fileMenu.submenu.insert(1, new MenuItem({ type: 'separator' }));
  }

  // Add Language submenu to View menu
  const viewMenu = menu.items.find(item => item.label === 'View');
  if (viewMenu && viewMenu.submenu) {
    viewMenu.submenu.append(new MenuItem({ type: 'separator' }));
    viewMenu.submenu.append(new MenuItem({
      label: 'Language',
      submenu: [
        {
          label: 'English',
          type: 'radio',
          checked: true,
          click: () => {
            mainWindow?.webContents.send('menu:changeLanguage', 'en');
          }
        },
        {
          label: 'Français',
          type: 'radio',
          click: () => {
            mainWindow?.webContents.send('menu:changeLanguage', 'fr');
          }
        },
        {
          label: 'Nederlands',
          type: 'radio',
          click: () => {
            mainWindow?.webContents.send('menu:changeLanguage', 'nl');
          }
        },
        {
          label: 'Deutsch',
          type: 'radio',
          click: () => {
            mainWindow?.webContents.send('menu:changeLanguage', 'de');
          }
        }
      ]
    }));
  }

  Menu.setApplicationMenu(menu);
}

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

// Python Code Viewer window handlers
ipcMain.handle('pythonCodeViewer:openWindow', async (_, code: string, title?: string) => {
  // Store the current code
  currentPythonCode = code;

  // If window already exists, just update the code and focus
  if (pythonCodeViewerWindow && !pythonCodeViewerWindow.isDestroyed()) {
    pythonCodeViewerWindow.webContents.executeJavaScript(`
      window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(code)} }));
    `);
    pythonCodeViewerWindow.focus();
    return true;
  }

  // Create new Python code viewer window
  pythonCodeViewerWindow = new BrowserWindow({
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
  pythonCodeViewerWindow.loadFile(path.join(__dirname, '../static/pythonCodeViewer.html'));

  // Show window when ready and send initial code
  pythonCodeViewerWindow.once('ready-to-show', () => {
    pythonCodeViewerWindow?.show();
    pythonCodeViewerWindow?.webContents.executeJavaScript(`
      window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(currentPythonCode)} }));
    `);
  });

  // Clean up reference when window is closed
  pythonCodeViewerWindow.on('closed', () => {
    pythonCodeViewerWindow = null;
  });

  return true;
});

ipcMain.handle('pythonCodeViewer:updateCode', async (_, code: string) => {
  currentPythonCode = code;
  if (pythonCodeViewerWindow && !pythonCodeViewerWindow.isDestroyed()) {
    pythonCodeViewerWindow.webContents.executeJavaScript(`
      window.dispatchEvent(new CustomEvent('codeUpdate', { detail: ${JSON.stringify(code)} }));
    `);
  }
  return true;
});


ipcMain.handle('pythonCodeViewer:closeWindow', async () => {
  if (pythonCodeViewerWindow && !pythonCodeViewerWindow.isDestroyed()) {
    pythonCodeViewerWindow.close();
    pythonCodeViewerWindow = null;
  }
  return true;
});

// Menu action handlers
ipcMain.handle('menu:openSettings', () => {
  mainWindow?.webContents.executeJavaScript(`
    window.location.hash = '/settings';
  `);
});

ipcMain.handle('menu:changeLanguage', (_, language: string) => {
  mainWindow?.webContents.executeJavaScript(`
    window.dispatchEvent(new CustomEvent('languageChange', { detail: '${language}' }));
  `);
});

// App event handlers
app.whenReady().then(() => {
  createApplicationMenu();
});

app.on('browser-window-created', (_, window) => {
  if (!mainWindow) {
    mainWindow = window;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // Create main window if needed
  }
});
