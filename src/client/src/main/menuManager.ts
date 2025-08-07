import { Menu, MenuItem, BrowserWindow, MenuItemConstructorOptions, app } from 'electron';

/**
 * Manages the application's native menu system
 */
export class MenuManager {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    // Empty constructor
  }

  /**
   * Set the main window reference for menu actions
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Create and set the application menu with Settings and Language options
   */
  createApplicationMenu(): void {
    const template: MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              console.log('Settings clicked, mainWindow:', this.mainWindow);
              this.mainWindow?.webContents.executeJavaScript(`
                window.location.hash = '/settings';
              `);
            }
          },
          { type: 'separator' as const },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' as const },
          { role: 'redo' as const },
          { type: 'separator' as const },
          { role: 'cut' as const },
          { role: 'copy' as const },
          { role: 'paste' as const },
          { role: 'selectAll' as const }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' as const },
          { role: 'forceReload' as const },
          { role: 'toggleDevTools' as const },
          { type: 'separator' as const },
          { role: 'resetZoom' as const },
          { role: 'zoomIn' as const },
          { role: 'zoomOut' as const },
          { type: 'separator' as const },
          { role: 'togglefullscreen' as const },
          { type: 'separator' as const },
          {
            label: 'Language',
            submenu: [
              {
                label: 'English',
                type: 'radio' as const,
                checked: true,
                click: () => {
                  console.log('English clicked, mainWindow:', this.mainWindow);
                  this.mainWindow?.webContents.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: 'en' }));
                  `);
                }
              },
              {
                label: 'Français',
                type: 'radio' as const,
                click: () => {
                  console.log('French clicked, mainWindow:', this.mainWindow);
                  this.mainWindow?.webContents.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: 'fr' }));
                  `);
                }
              },
              {
                label: 'Nederlands',
                type: 'radio' as const,
                click: () => {
                  console.log('Dutch clicked, mainWindow:', this.mainWindow);
                  this.mainWindow?.webContents.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: 'nl' }));
                  `);
                }
              },
              {
                label: 'Deutsch',
                type: 'radio' as const,
                click: () => {
                  console.log('German clicked, mainWindow:', this.mainWindow);
                  this.mainWindow?.webContents.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: 'de' }));
                  `);
                }
              }
            ]
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' as const },
          { role: 'close' as const }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              // TODO: Show about dialog
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}
