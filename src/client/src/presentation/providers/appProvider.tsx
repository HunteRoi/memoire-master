import {
  FC,
  PropsWithChildren,
  useMemo,
  useReducer,
  useCallback,
  useRef,
} from 'react';

import {
  type AppAction,
  AppContext,
  type AppState,
} from '../contexts/appContext';
import { ThemeType } from '../types/Theme';
import { Age } from '../types/Age';
import { ModeType } from '../types/Mode';
import { Robot } from '../../domain/robot';
import { isSuccess } from '../../domain/result';
import { AlertSnackbarProps } from '../components/layout/alertSnackbar';

const initialState: AppState = {
  theme: ThemeType.CLASSIC,
  language: 'en',
  userAge: new Age(10),
  selectedMode: null,
  selectedRobot: null,
  robots: [],
  connectedRobots: new Set<string>(),
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
    case 'REMOVE_CONNECTED_ROBOT':
      const newConnectedRobots = new Set(state.connectedRobots);
      newConnectedRobots.delete(action.payload);
      return { ...state, connectedRobots: newConnectedRobots };
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

  const setTheme = useCallback(
    (theme: ThemeType) => dispatch({ type: 'SET_THEME', payload: theme }),
    [dispatch]
  );

  const setLanguage = useCallback(
    (language: string) => dispatch({ type: 'SET_LANGUAGE', payload: language }),
    [dispatch]
  );

  const setUserAge = useCallback(
    (age: Age) => dispatch({ type: 'SET_USER_AGE', payload: age }),
    [dispatch]
  );

  const setSelectedRobot = useCallback(
    (robotId: string | null) =>
      dispatch({ type: 'SET_SELECTED_ROBOT', payload: robotId }),
    [dispatch]
  );

  const setSelectedMode = useCallback(
    (mode: ModeType) => dispatch({ type: 'SET_SELECTED_MODE', payload: mode }),
    [dispatch]
  );

  const setRobotsList = useCallback(
    (robots: Robot[]) => dispatch({ type: 'SET_ROBOTS_LIST', payload: robots }),
    [dispatch]
  );

  const setLoading = useCallback(
    (isLoading: boolean) =>
      dispatch({ type: 'SET_LOADING', payload: isLoading }),
    [dispatch]
  );

  const setError = useCallback(
    (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    [dispatch]
  );

  const addConnectedRobot = useCallback(
    (robotId: string) =>
      dispatch({ type: 'ADD_CONNECTED_ROBOT', payload: robotId }),
    [dispatch]
  );

  const removeConnectedRobot = useCallback(
    (robotId: string) =>
      dispatch({ type: 'REMOVE_CONNECTED_ROBOT', payload: robotId }),
    [dispatch]
  );

  const isRobotConnected = useCallback(
    (robotId: string) => state.connectedRobots.has(robotId),
    [state.connectedRobots]
  );

  const showAlert = useCallback(
    (message: string, severity: AlertSnackbarProps['severity'] = 'info') =>
      dispatch({ type: 'SHOW_ALERT', payload: { message, severity } }),
    [dispatch]
  );

  const hideAlert = useCallback(
    () => dispatch({ type: 'HIDE_ALERT' }),
    [dispatch]
  );

  const resetState = useCallback(
    () => dispatch({ type: 'RESET_STATE' }),
    [dispatch]
  );

  const ensureRobotsLoaded = useCallback(async () => {
    if (state.robots.length === 0 && !loadingRef.current.robots) {
      loadingRef.current.robots = true;
      try {
        const result = await window.electronAPI.manageRobots.loadRobots();
        if (isSuccess(result)) {
          const robots = result.data.map(
            robot => new Robot(robot.ipAddress, robot.port)
          );
          setRobotsList(robots);
        }
      } catch (error) {
        console.error('Failed to lazy load robots:', error);
      } finally {
        loadingRef.current.robots = false;
      }
    }
  }, [state.robots.length, setRobotsList]);

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
      isRobotConnected,
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
      isRobotConnected,
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
