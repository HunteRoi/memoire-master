import { app, BrowserWindow } from 'electron';

// Import modular components
import { MenuManager } from './menuManager';
import { PythonCodeViewerManager } from './pythonCodeViewerManager';
import { registerAppIpcHandlers } from './appIpcHandlers';
import { registerRobotIpcHandlers } from './robotIpcHandlers';

// Initialize managers
const menuManager = new MenuManager();

// Track main window for menu operations
let mainWindow: BrowserWindow | null = null;

/**
 * Initialize all IPC handlers
 */
function initializeIpcHandlers(): void {
  registerAppIpcHandlers();
  registerRobotIpcHandlers();

  // Initialize Python Code Viewer manager (registers its own IPC handlers)
  new PythonCodeViewerManager();
}

/**
 * Set up application lifecycle event handlers
 */
function setupAppLifecycle(): void {
  // App ready handler
  app.whenReady().then(() => {
    initializeIpcHandlers();
    // Menu will be created after first window is created
  });

  // Track main window creation
  app.on('browser-window-created', (_, window) => {
    if (!mainWindow) {
      mainWindow = window;
      menuManager.setMainWindow(window);
      // Create menu after window is available
      menuManager.createApplicationMenu();
      console.log('Main window set and menu created');
    }
  });

  // Handle all windows closed
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      // Create main window if needed - handled by the main application
    }
  });
}

// Initialize the application
setupAppLifecycle();
