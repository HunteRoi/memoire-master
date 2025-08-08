import {
  app,
  type BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
} from 'electron';
import type { Logger } from './application/interfaces/logger';

/**
 * A wrapper for the application menu management methods
 *
 * @export
 * @class ApplicationMenuManager
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Manager pattern for menu operations
export class ApplicationMenuManager {
  /**
   * Create and set the application menu with Settings and Language options
   */
  public static createApplicationMenu(
    mainWindow: BrowserWindow,
    logger: Logger
  ): void {
    const template: MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              logger.debug('Settings menu clicked', {
                hasMainWindow: !!mainWindow,
              });
              mainWindow?.webContents.executeJavaScript(`
                window.location.hash = '/settings';
              `);
            },
          },
          { type: 'separator' as const },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
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
                  logger.debug('Language changed to English', {
                    hasMainWindow: !!mainWindow,
                  });
                  mainWindow?.webContents.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: 'en' }));
                  `);
                },
              },
              {
                label: 'Français',
                type: 'radio' as const,
                click: () => {
                  logger.debug('Language changed to French', {
                    hasMainWindow: !!mainWindow,
                  });
                  mainWindow?.webContents.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: 'fr' }));
                  `);
                },
              },
              {
                label: 'Nederlands',
                type: 'radio' as const,
                click: () => {
                  logger.debug('Language changed to Dutch', {
                    hasMainWindow: !!mainWindow,
                  });
                  mainWindow?.webContents.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: 'nl' }));
                  `);
                },
              },
              {
                label: 'Deutsch',
                type: 'radio' as const,
                click: () => {
                  logger.debug('Language changed to German', {
                    hasMainWindow: !!mainWindow,
                  });
                  mainWindow?.webContents.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: 'de' }));
                  `);
                },
              },
            ],
          },
        ],
      },
      {
        label: 'Window',
        submenu: [{ role: 'minimize' as const }, { role: 'close' as const }],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}
