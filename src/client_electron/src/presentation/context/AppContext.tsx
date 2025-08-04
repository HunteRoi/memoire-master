import React, { createContext, useContext, useReducer, ReactNode } from 'react';

import { Robot } from '../../domain/entities/Robot';
import { ThemeType } from '../types/Theme';
import { Age } from '../types/Age';
import { ModeType } from '../types/Mode';
import { Container } from '../di/Container';
import { ManageRobotsUseCase } from '../../application/use-cases/ManageRobotsUseCase';
import { RobotConnectionUseCase } from '../../application/use-cases/RobotConnectionUseCase';
import { RobotCommunicationService } from '../../application/services/RobotCommunicationService';
import { RobotsConfigurationRepository } from '../../application/repositories/RobotsConfigurationRepository';
import { ConnectedRobotRepository } from '../../application/repositories/ConnectedRobotRepository';

interface AppState {
  robotsList: Robot[];
  theme: ThemeType;
  userAge?: Age | null;
  selectedRobot?: string | null;
  selectedMode?: ModeType | null;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_THEME'; payload: ThemeType }
  | { type: 'SET_USER_AGE'; payload: Age }
  | { type: 'SET_SELECTED_ROBOT'; payload: string }
  | { type: 'SET_SELECTED_MODE'; payload: ModeType }
  | { type: 'SET_ROBOTS_LIST'; payload: Robot[] }
  | { type: 'ADD_ROBOT'; payload: Robot }
  | { type: 'UPDATE_ROBOT'; payload: Robot }
  | { type: 'REMOVE_ROBOT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  robotsList: [],
  theme: ThemeType.CLASSIC,
  userAge: null,
  selectedRobot: '121',
  selectedMode: ModeType.EXPLORATION,
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_USER_AGE':
      return { ...state, userAge: action.payload };
    case 'SET_SELECTED_ROBOT':
      return { ...state, selectedRobot: action.payload };
    case 'SET_SELECTED_MODE':
      return { ...state, selectedMode: action.payload };
    case 'SET_ROBOTS_LIST':
      return { ...state, robotsList: action.payload };
    case 'ADD_ROBOT':
      return { ...state, robotsList: [...state.robotsList, action.payload] };
    case 'UPDATE_ROBOT':
      return {
        ...state,
        robotsList: state.robotsList.map(robot =>
          robot.id === action.payload.id ? action.payload : robot
        ),
      };
    case 'REMOVE_ROBOT':
      return {
        ...state,
        robotsList: state.robotsList.filter(robot => robot.id !== action.payload),
        selectedRobot: state.selectedRobot === action.payload ? null : state.selectedRobot,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Use Cases and Services
  manageRobotsUseCase: ManageRobotsUseCase;
  robotConnectionUseCase: RobotConnectionUseCase;
  robotCommunicationService: RobotCommunicationService;
  robotsConfigurationRepository: RobotsConfigurationRepository;
  connectedRobotRepository: ConnectedRobotRepository;

  setTheme: (theme: ThemeType) => void;
  setUserAge: (age: Age) => void;
  setSelectedRobot: (robotId: string) => void;
  setSelectedMode: (mode: ModeType) => void;
  setRobotsList: (robots: Robot[]) => void;
  addRobot: (robot: Robot) => void;
  updateRobot: (robot: Robot) => void;
  removeRobot: (robotId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const container = Container.getInstance();

  const contextValue: AppContextType = {
    state,
    dispatch,

    // Use Cases and Services from Container
    manageRobotsUseCase: container.manageRobotsUseCase,
    robotConnectionUseCase: container.robotConnectionUseCase,
    robotCommunicationService: container.robotCommunicationService,
    robotsConfigurationRepository: container.robotsConfigurationRepository,
    connectedRobotRepository: container.connectedRobotRepository,

    // Convenience methods
    setTheme: (theme: ThemeType) => dispatch({ type: 'SET_THEME', payload: theme }),
    setUserAge: (age: Age) => dispatch({ type: 'SET_USER_AGE', payload: age }),
    setSelectedRobot: (robotId: string) => dispatch({ type: 'SET_SELECTED_ROBOT', payload: robotId }),
    setSelectedMode: (mode: ModeType) => dispatch({ type: 'SET_SELECTED_MODE', payload: mode }),
    setRobotsList: (robots: Robot[]) => dispatch({ type: 'SET_ROBOTS_LIST', payload: robots }),
    addRobot: (robot: Robot) => dispatch({ type: 'ADD_ROBOT', payload: robot }),
    updateRobot: (robot: Robot) => dispatch({ type: 'UPDATE_ROBOT', payload: robot }),
    removeRobot: (robotId: string) => dispatch({ type: 'REMOVE_ROBOT', payload: robotId }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
