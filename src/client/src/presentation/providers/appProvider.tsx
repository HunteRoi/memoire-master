import {
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { DEFAULT_ROBOT } from '../../domain/constants';
import { isSuccess } from '../../domain/result';
import { Robot, type RobotConfig } from '../../domain/robot';
import type { AlertSnackbarProps } from '../components/layout/alertSnackbar';
import {
  type AppAction,
  AppContext,
  type AppState,
} from '../contexts/appContext';
import { Age } from '../models/Age';
import { ModeType } from '../models/Mode';
import { ThemeType } from '../models/Theme';

const initialState: AppState = {
  theme: ThemeType.CLASSIC,
  language: 'en',
  userAge: new Age(10),
  selectedMode: ModeType.EXPLORATION,
  selectedRobot: DEFAULT_ROBOT.id,
  robots: [DEFAULT_ROBOT],
  connectedRobots: new Set<string>(),
  robotStatus: new Map(),
  isLoading: false,
  error: null,
  alert: {
    open: false,
    message: '',
    severity: 'info',
    onClose: () => {},
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_USER_AGE':
      return { ...state, userAge: action.payload };
    case 'SET_SELECTED_ROBOT':
      return { ...state, selectedRobot: action.payload };
    case 'SET_SELECTED_MODE':
      return { ...state, selectedMode: action.payload };
    case 'SET_ROBOTS_LIST':
      return { ...state, robots: action.payload };
    case 'ADD_CONNECTED_ROBOT':
      return {
        ...state,
        connectedRobots: new Set([...state.connectedRobots, action.payload]),
      };
    case 'REMOVE_CONNECTED_ROBOT': {
      const newConnectedRobots = new Set(state.connectedRobots);
      newConnectedRobots.delete(action.payload);
      const newRobotStatus = new Map(state.robotStatus);
      newRobotStatus.delete(action.payload);
      return { 
        ...state, 
        connectedRobots: newConnectedRobots,
        robotStatus: newRobotStatus
      };
    }
    case 'UPDATE_ROBOT_STATUS': {
      const newRobotStatus = new Map(state.robotStatus);
      newRobotStatus.set(action.payload.robotId, action.payload);
      return {
        ...state,
        robotStatus: newRobotStatus
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SHOW_ALERT':
      return {
        ...state,
        alert: {
          open: true,
          message: action.payload.message,
          severity: action.payload.severity,
          onClose: () => {},
        },
      };
    case 'HIDE_ALERT':
      return { ...state, alert: { ...state.alert, open: false } };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const loadingRef = useRef({ robots: false, theme: false });

  const transformRobotData = useCallback(
    (robotConfigs: RobotConfig[]): Robot[] => {
      return robotConfigs
        .map(robot => {
          const result = Robot.create()
            .setIpAddress(robot.ipAddress)
            .setPort(robot.port)
            .build();

          if (!result.success) {
            console.error(`Failed to create robot: ${result.error}`);
            return null;
          }

          return result.data;
        })
        .filter((robot): robot is Robot => robot !== null);
    },
    []
  );

  const setTheme = useCallback(
    (theme: ThemeType) => dispatch({ type: 'SET_THEME', payload: theme }),
    []
  );

  const setLanguage = useCallback(
    (language: string) => dispatch({ type: 'SET_LANGUAGE', payload: language }),
    []
  );

  const setUserAge = useCallback(
    (age: Age) => dispatch({ type: 'SET_USER_AGE', payload: age }),
    []
  );

  const setSelectedRobot = useCallback(
    (robotId: string | null) =>
      dispatch({ type: 'SET_SELECTED_ROBOT', payload: robotId }),
    []
  );

  const setSelectedMode = useCallback(
    (mode: ModeType) => dispatch({ type: 'SET_SELECTED_MODE', payload: mode }),
    []
  );

  const setRobotsList = useCallback(
    (robots: Robot[]) => dispatch({ type: 'SET_ROBOTS_LIST', payload: robots }),
    []
  );

  const setLoading = useCallback(
    (isLoading: boolean) =>
      dispatch({ type: 'SET_LOADING', payload: isLoading }),
    []
  );

  const setError = useCallback(
    (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    []
  );

  const addConnectedRobot = useCallback(
    (robotId: string) =>
      dispatch({ type: 'ADD_CONNECTED_ROBOT', payload: robotId }),
    []
  );

  const removeConnectedRobot = useCallback(
    (robotId: string) =>
      dispatch({ type: 'REMOVE_CONNECTED_ROBOT', payload: robotId }),
    []
  );

  const updateRobotStatus = useCallback(
    (status: import('../contexts/appContext').RobotStatusInfo) =>
      dispatch({ type: 'UPDATE_ROBOT_STATUS', payload: status }),
    []
  );

  const getRobotStatus = useCallback(
    (robotId: string) => state.robotStatus.get(robotId),
    [state.robotStatus]
  );

  const getRobotBattery = useCallback(
    (robotId: string) => {
      const status = state.robotStatus.get(robotId);
      return status?.batteryPercentage || 0;
    },
    [state.robotStatus]
  );

  const isRobotConnected = useCallback(
    (robotId: string) => state.connectedRobots.has(robotId),
    [state.connectedRobots]
  );

  const showAlert = useCallback(
    (message: string, severity: AlertSnackbarProps['severity'] = 'info') =>
      dispatch({ type: 'SHOW_ALERT', payload: { message, severity } }),
    []
  );

  const hideAlert = useCallback(() => dispatch({ type: 'HIDE_ALERT' }), []);

  const resetState = useCallback(() => dispatch({ type: 'RESET_STATE' }), []);

  const ensureRobotsLoaded = useCallback(async () => {
    if (state.robots.length === 1 && !loadingRef.current.robots) {
      loadingRef.current.robots = true;
      setLoading(true);
      try {
        const result = await window.electronAPI.manageRobots.loadRobots();
        if (isSuccess(result)) {
          setRobotsList(transformRobotData(result.data as RobotConfig[]));
        }
      } catch (error) {
        console.error('Failed to lazy load robots:', error);
      } finally {
        loadingRef.current.robots = false;
        setLoading(false);
      }
    }
  }, [state.robots.length, setRobotsList, setLoading, transformRobotData]);

  const ensureThemeLoaded = useCallback(() => {
    if (!loadingRef.current.theme) {
      loadingRef.current.theme = true;
      try {
        const savedTheme = localStorage.getItem('pucklab-theme') as ThemeType;
        if (savedTheme && Object.values(ThemeType).includes(savedTheme)) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme from localStorage:', error);
      } finally {
        loadingRef.current.theme = false;
      }
    }
  }, [setTheme]);

  const ensureLanguageLoaded = useCallback(() => {
    try {
      const savedLanguage = localStorage.getItem('pucklab-language');
      if (savedLanguage && ['en', 'fr', 'nl', 'de'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language from localStorage:', error);
    }
  }, [setLanguage]);

  // Set up global disconnect listener
  useEffect(() => {
    const handleRobotDisconnect = (robotId: string) => {
      console.log('Robot disconnected unexpectedly:', robotId);
      removeConnectedRobot(robotId);
      
      // If the disconnected robot was the selected one, clear selection
      if (state.selectedRobot === robotId) {
        setSelectedRobot(null);
      }
      
      // Show alert to user
      showAlert('Robot disconnected unexpectedly', 'warning');
    };

    // Set up listener
    window.electronAPI.robotConnection.onDisconnect(handleRobotDisconnect);

    // Cleanup on unmount
    return () => {
      window.electronAPI.robotConnection.removeDisconnectListener();
    };
  }, [removeConnectedRobot, setSelectedRobot, showAlert, state.selectedRobot]);

  // Set up robot status update listener
  useEffect(() => {
    const handleRobotStatusUpdate = (status: import('../contexts/appContext').RobotStatusInfo) => {
      console.log('Robot status update received:', status);
      updateRobotStatus(status);
    };

    // Set up listener
    window.electronAPI.robotConnection.onRobotStatusUpdate(handleRobotStatusUpdate);

    // Cleanup on unmount
    return () => {
      window.electronAPI.robotConnection.removeRobotStatusListener();
    };
  }, [updateRobotStatus]);

  const contextValue = useMemo(
    () => ({
      ...state,
      alert: {
        ...state.alert,
        onClose: hideAlert,
      },
      setTheme,
      setLanguage,
      setUserAge,
      setSelectedRobot,
      setSelectedMode,
      setRobotsList,
      addConnectedRobot,
      removeConnectedRobot,
      updateRobotStatus,
      getRobotStatus,
      getRobotBattery,
      isRobotConnected,
      transformRobotData,
      setLoading,
      setError,
      showAlert,
      hideAlert,
      resetState,
      ensureRobotsLoaded,
      ensureThemeLoaded,
      ensureLanguageLoaded,
    }),
    [
      state,
      setTheme,
      setLanguage,
      setUserAge,
      setSelectedRobot,
      setSelectedMode,
      setRobotsList,
      addConnectedRobot,
      removeConnectedRobot,
      updateRobotStatus,
      getRobotStatus,
      getRobotBattery,
      isRobotConnected,
      transformRobotData,
      setLoading,
      setError,
      showAlert,
      hideAlert,
      resetState,
      ensureRobotsLoaded,
      ensureThemeLoaded,
      ensureLanguageLoaded,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
