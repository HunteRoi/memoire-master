import { BrowserWindow, ipcMain } from 'electron';
import { createErrorResponse, isRobotError } from '../domain/errors';
import { isSuccess } from '../domain/result';
import { Robot } from '../domain/robot';
import type { RobotFeedback } from '../domain/robotFeedback';
import { Container } from './container';
import { IpcValidator } from './infrastructure/security/ipcValidator';

/**
 * A wrapper for the robot management methods (through IPC)
 *
 * @export
 * @class RobotIpcHandlersManager
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Manager pattern for IPC handler operations
export class RobotIpcHandlersManager {
  private static container = Container.getInstance();
  private static logger = this.container.logger;
  private static feedbackSubscriptions = new Map<string, Robot>();
  private static validator = new IpcValidator(this.container.logger);

  /**
   * Registers IPC handlers for robot management and connection operations
   * with enhanced security validation and logging
   */
  public static registerRobotIpcHandlers(): void {
    RobotIpcHandlersManager.registerRobotManagementHandlers();
    RobotIpcHandlersManager.registerRobotConnectionHandlers();
    RobotIpcHandlersManager.registerRobotFeedbackHandlers();
  }

  private static createSecureHandler<T extends unknown[], R>(
    channel: string,
    handler: (...args: T) => Promise<R>
  ) {
    return async (
      event: Electron.IpcMainInvokeEvent,
      ...args: T
    ): Promise<R | { success: false; error: string; code?: string }> => {
      try {
        // Channel validation
        if (!RobotIpcHandlersManager.validator.isChannelAllowed(channel)) {
          throw new Error(`Unauthorized IPC channel: ${channel}`);
        }

        const senderId = event.sender.id.toString();

        // Log IPC call
        RobotIpcHandlersManager.logger.debug('IPC call received', {
          channel,
          senderId,
        });

        return await handler(...args);
      } catch (error) {
        RobotIpcHandlersManager.logger.error(
          `IPC handler error for ${channel}`,
          error instanceof Error ? error : undefined,
          {
            channel,
            senderId: event.sender.id.toString(),
          }
        );

        if (isRobotError(error)) {
          return createErrorResponse(error);
        }

        return createErrorResponse(error);
      }
    };
  }

  private static registerRobotFeedbackHandlers() {
    ipcMain.handle(
      'robotFeedback:subscribe',
      RobotIpcHandlersManager.createSecureHandler(
        'robotFeedback:subscribe',
        async (robotConfig: unknown) => {
          const validatedRobotConfig =
            RobotIpcHandlersManager.validator.validateRobotConfig(robotConfig);
          const robotKey = `${validatedRobotConfig.ipAddress}:${validatedRobotConfig.port}`;

          // Create feedback callback that sends data to renderer
          const feedbackCallback = (feedback: RobotFeedback) => {
            const mainWindow =
              BrowserWindow.getFocusedWindow() ||
              BrowserWindow.getAllWindows()[0];
            if (mainWindow) {
              mainWindow.webContents.send('robotFeedback:message', feedback);
            }
          };

          // Subscribe to feedback through the use case
          const result =
            await RobotIpcHandlersManager.container.robotConnection.subscribeToFeedback(
              validatedRobotConfig,
              feedbackCallback
            );
          if (isSuccess(result)) {
            const robotResult = Robot.create()
              .setIpAddress(validatedRobotConfig.ipAddress)
              .setPort(validatedRobotConfig.port)
              .build();

            if (!isSuccess(robotResult)) {
              RobotIpcHandlersManager.logger.error(
                'Failed to create robot instance for feedback subscription',
                undefined,
                { error: robotResult.error }
              );
              return createErrorResponse({
                message: robotResult.error,
                code: 'ROBOT_CREATION_FAILED',
              });
            }

            const robot = robotResult.data;
            RobotIpcHandlersManager.feedbackSubscriptions.set(robotKey, robot);
            RobotIpcHandlersManager.logger.info(
              'Subscribed to robot feedback via IPC',
              {
                robotId: robot.id,
              }
            );
            return true;
          } else {
            RobotIpcHandlersManager.logger.error(
              'Failed to subscribe to robot feedback via IPC',
              undefined,
              { error: result.error }
            );
            return false;
          }
        }
      )
    );

    ipcMain.handle(
      'robotFeedback:unsubscribe',
      RobotIpcHandlersManager.createSecureHandler(
        'robotFeedback:unsubscribe',
        async (robotConfig: unknown) => {
          const validatedRobotConfig =
            RobotIpcHandlersManager.validator.validateRobotConfig(robotConfig);
          const robotKey = `${validatedRobotConfig.ipAddress}:${validatedRobotConfig.port}`;

          // Unsubscribe from feedback through the use case
          const result =
            await RobotIpcHandlersManager.container.robotConnection.unsubscribeFromFeedback(
              validatedRobotConfig
            );
          if (isSuccess(result)) {
            RobotIpcHandlersManager.feedbackSubscriptions.delete(robotKey);
            const robotResult = Robot.create()
              .setIpAddress(validatedRobotConfig.ipAddress)
              .setPort(validatedRobotConfig.port)
              .build();

            if (!isSuccess(robotResult)) {
              RobotIpcHandlersManager.logger.error(
                'Failed to create robot instance for feedback unsubscription',
                undefined,
                { error: robotResult.error }
              );
              return createErrorResponse({
                message: robotResult.error,
                code: 'ROBOT_CREATION_FAILED',
              });
            }

            const robot = robotResult.data;
            RobotIpcHandlersManager.logger.info(
              'Unsubscribed from robot feedback via IPC',
              {
                robotId: robot.id,
              }
            );
            return true;
          } else {
            RobotIpcHandlersManager.logger.error(
              'Failed to unsubscribe from robot feedback via IPC',
              undefined,
              { error: result.error }
            );
            return false;
          }
        }
      )
    );

    ipcMain.handle(
      'robotFeedback:sendCommand',
      RobotIpcHandlersManager.createSecureHandler(
        'robotFeedback:sendCommand',
        async (robotConfig: unknown, command: unknown) => {
          const validatedRobotConfig =
            RobotIpcHandlersManager.validator.validateRobotConfig(robotConfig);
          const validatedCommand =
            RobotIpcHandlersManager.validator.validateCommand(command);

          const robotResult = Robot.create()
            .setIpAddress(validatedRobotConfig.ipAddress)
            .setPort(validatedRobotConfig.port)
            .build();

          if (!isSuccess(robotResult)) {
            RobotIpcHandlersManager.logger.error(
              'Failed to create robot instance for command sending',
              undefined,
              { error: robotResult.error }
            );
            return createErrorResponse({
              message: robotResult.error,
              code: 'ROBOT_CREATION_FAILED',
            });
          }

          const robot = robotResult.data;

          try {
            const result =
              await RobotIpcHandlersManager.container.robotConnection.sendCommand(
                validatedRobotConfig,
                validatedCommand
              );

            if (isSuccess(result)) {
              // Send command execution feedback
              const feedback: RobotFeedback = {
                robotId: robot.id,
                timestamp: Date.now(),
                type: 'success',
                message: `Command executed: ${validatedCommand.substring(0, 50)}`,
                data: result.data,
              };

              RobotIpcHandlersManager.container.robotConnection.sendFeedback(
                feedback
              );
              RobotIpcHandlersManager.logger.info(
                'Command sent to robot via IPC',
                {
                  robotId: robot.id,
                  commandLength: validatedCommand.length,
                }
              );
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
              message: `Command failed: ${validatedCommand.substring(0, 50)} - ${error}`,
              data: { error: error instanceof Error ? error.message : error },
            };

            RobotIpcHandlersManager.container.robotConnection.sendFeedback(
              feedback
            );
            throw error;
          }
        }
      )
    );
  }

  private static registerRobotConnectionHandlers() {
    ipcMain.handle(
      'robotConnection:connectToRobot',
      RobotIpcHandlersManager.createSecureHandler(
        'robotConnection:connectToRobot',
        async (robot: unknown) => {
          const validatedRobot =
            RobotIpcHandlersManager.validator.validateRobotConfig(robot);
          return await RobotIpcHandlersManager.container.robotConnection.connectToRobot(
            validatedRobot
          );
        }
      )
    );

    ipcMain.handle(
      'robotConnection:disconnectFromRobot',
      RobotIpcHandlersManager.createSecureHandler(
        'robotConnection:disconnectFromRobot',
        async (robot: unknown) => {
          const validatedRobot =
            RobotIpcHandlersManager.validator.validateRobotConfig(robot);
          return await RobotIpcHandlersManager.container.robotConnection.disconnectFromRobot(
            validatedRobot
          );
        }
      )
    );

    ipcMain.handle(
      'robotConnection:checkConnection',
      RobotIpcHandlersManager.createSecureHandler(
        'robotConnection:checkConnection',
        async (robot: unknown) => {
          const validatedRobot =
            RobotIpcHandlersManager.validator.validateRobotConfig(robot);
          return await RobotIpcHandlersManager.container.robotConnection.checkConnection(
            validatedRobot
          );
        }
      )
    );
  }

  private static registerRobotManagementHandlers() {
    ipcMain.handle(
      'manageRobots:loadRobots',
      RobotIpcHandlersManager.createSecureHandler(
        'manageRobots:loadRobots',
        async () => {
          return await RobotIpcHandlersManager.container.manageRobots.loadRobots();
        }
      )
    );

    ipcMain.handle(
      'manageRobots:addRobot',
      RobotIpcHandlersManager.createSecureHandler(
        'manageRobots:addRobot',
        async (robot: unknown) => {
          const validatedRobot =
            RobotIpcHandlersManager.validator.validateRobotConfig(robot);
          return await RobotIpcHandlersManager.container.manageRobots.addRobot(
            validatedRobot
          );
        }
      )
    );

    ipcMain.handle(
      'manageRobots:updateRobot',
      RobotIpcHandlersManager.createSecureHandler(
        'manageRobots:updateRobot',
        async (robot: unknown) => {
          const validatedRobot =
            RobotIpcHandlersManager.validator.validateRobotConfig(robot);
          return await RobotIpcHandlersManager.container.manageRobots.updateRobot(
            validatedRobot
          );
        }
      )
    );

    ipcMain.handle(
      'manageRobots:removeRobot',
      RobotIpcHandlersManager.createSecureHandler(
        'manageRobots:removeRobot',
        async (robotId: unknown) => {
          const validatedRobotId =
            RobotIpcHandlersManager.validator.validateRobotId(robotId);
          return await RobotIpcHandlersManager.container.manageRobots.removeRobot(
            validatedRobotId
          );
        }
      )
    );

    ipcMain.handle(
      'manageRobots:clearRobots',
      RobotIpcHandlersManager.createSecureHandler(
        'manageRobots:clearRobots',
        async () => {
          return await RobotIpcHandlersManager.container.manageRobots.clearRobots();
        }
      )
    );

    ipcMain.handle(
      'manageRobots:findRobotById',
      RobotIpcHandlersManager.createSecureHandler(
        'manageRobots:findRobotById',
        async (robotId: unknown) => {
          const validatedRobotId =
            RobotIpcHandlersManager.validator.validateRobotId(robotId);
          return await RobotIpcHandlersManager.container.manageRobots.findRobotById(
            validatedRobotId
          );
        }
      )
    );
  }
}
