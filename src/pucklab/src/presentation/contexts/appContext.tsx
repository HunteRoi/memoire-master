import { createContext } from 'react';

import { ThemeType } from '../types/Theme';
import { Age } from '../types/Age';
import { ModeType } from '../types/Mode';
import { Robot } from '../../domain/robot';

export type AppState = {
  theme: ThemeType;
  userAge?: Age | null;
  selectedMode?: ModeType | null;
  selectedRobot?: string | null;
  robots: Robot[];
  isLoading: boolean;
  error: string | null;
};

export type AppAction =
    | { type: 'SET_THEME'; payload: ThemeType }
    | { type: 'SET_USER_AGE'; payload: Age }
    | { type: 'SET_SELECTED_ROBOT'; payload: string }
    | { type: 'SET_SELECTED_MODE'; payload: ModeType }
    | { type: 'SET_ROBOTS_LIST'; payload: Robot[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET_STATE' };

export type AppContextType = AppState & {
  setTheme: (theme: ThemeType) => void;
  setUserAge: (age: Age) => void;
  setSelectedMode: (mode: ModeType | null) => void;
  setSelectedRobot: (robotId: string | null) => void;
  setRobotsList: (robots: Robot[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
  ensureRobotsLoaded: () => Promise<void>;
  ensureThemeLoaded: () => void;
};

export const AppContext = createContext<AppContextType | null>(null);
