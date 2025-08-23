import { createContext } from 'react';

import type { AlertSnackbarProps } from '../components/layout/alertSnackbar';
import type { Robot, RobotConfig } from '../../domain/robot';
import type { Age } from '../models/Age';
import type { ModeType } from '../models/Mode';
import type { ThemeType } from '../models/Theme';

export interface RobotStatusInfo {
  robotId: string;
  batteryPercentage: number;
  batteryVoltage?: number;
  status: string;
  lastUpdate: number;
  hardwareStatus?: {
    motors: boolean;
    leds: boolean;
    audio: boolean;
    sensors: boolean;
  };
}

export type AppState = {
  theme: ThemeType;
  language: string;
  userAge: Age;
  selectedMode: ModeType;
  selectedRobot: string | null;
  robots: Robot[];
  connectedRobots: Set<string>;
  robotStatus: Map<string, RobotStatusInfo>;
  isLoading: boolean;
  error: string | null;
  alert: AlertSnackbarProps;
};

export type AppAction =
  | { type: 'SET_THEME'; payload: ThemeType }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_USER_AGE'; payload: Age }
  | { type: 'SET_SELECTED_ROBOT'; payload: string | null }
  | { type: 'SET_SELECTED_MODE'; payload: ModeType }
  | { type: 'SET_ROBOTS_LIST'; payload: Robot[] }
  | { type: 'ADD_CONNECTED_ROBOT'; payload: string }
  | { type: 'REMOVE_CONNECTED_ROBOT'; payload: string }
  | { type: 'UPDATE_ROBOT_STATUS'; payload: RobotStatusInfo }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | {
      type: 'SHOW_ALERT';
      payload: { message: string; severity: AlertSnackbarProps['severity'] };
    }
  | { type: 'HIDE_ALERT' }
  | { type: 'RESET_STATE' };

export type AppContextType = AppState & {
  setTheme: (theme: ThemeType) => void;
  setLanguage: (language: string) => void;
  setUserAge: (age: Age) => void;
  setSelectedMode: (mode: ModeType) => void;
  setSelectedRobot: (robotId: string | null) => void;
  setRobotsList: (robots: Robot[]) => void;
  addConnectedRobot: (robotId: string) => void;
  removeConnectedRobot: (robotId: string) => void;
  updateRobotStatus: (status: RobotStatusInfo) => void;
  getRobotStatus: (robotId: string) => RobotStatusInfo | undefined;
  getRobotBattery: (robotId: string) => number;
  isRobotConnected: (robotId: string) => boolean;
  transformRobotData: (robotConfigs: RobotConfig[]) => Robot[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  showAlert: (
    message: string,
    severity?: AlertSnackbarProps['severity']
  ) => void;
  hideAlert: () => void;
  resetState: () => void;
  ensureRobotsLoaded: () => Promise<void>;
  ensureThemeLoaded: () => void;
  ensureLanguageLoaded: () => void;
};

export const AppContext = createContext<AppContextType | null>(null);
