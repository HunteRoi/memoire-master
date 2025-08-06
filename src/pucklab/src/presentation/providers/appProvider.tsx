import { FC, PropsWithChildren, useMemo, useReducer, useCallback, useRef } from 'react';

import { type AppAction, AppContext, type AppState } from '../contexts/appContext';
import { ThemeType } from '../types/Theme';
import { Age } from '../types/Age';
import { ModeType } from '../types/Mode';
import { Robot } from '../../domain/robot';
import { isSuccess } from '../../domain/result';

const initialState: AppState = {
    theme: ThemeType.CLASSIC,
    userAge: null,
    selectedMode: null,
    selectedRobot: null,
    robots: [],
    isLoading: false,
    error: null
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
            return { ...state, robots: action.payload };
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

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const loadingRef = useRef({ robots: false, theme: false });

    const setTheme = useCallback((theme: ThemeType) => 
        dispatch({ type: 'SET_THEME', payload: theme }), [dispatch]);
    
    const setUserAge = useCallback((age: Age) => 
        dispatch({ type: 'SET_USER_AGE', payload: age }), [dispatch]);
    
    const setSelectedRobot = useCallback((robotId: string | null) => 
        dispatch({ type: 'SET_SELECTED_ROBOT', payload: robotId }), [dispatch]);
    
    const setSelectedMode = useCallback((mode: ModeType) => 
        dispatch({ type: 'SET_SELECTED_MODE', payload: mode }), [dispatch]);
    
    const setRobotsList = useCallback((robots: Robot[]) => 
        dispatch({ type: 'SET_ROBOTS_LIST', payload: robots }), [dispatch]);
    
    const setLoading = useCallback((isLoading: boolean) => 
        dispatch({ type: 'SET_LOADING', payload: isLoading }), [dispatch]);
    
    const setError = useCallback((error: string | null) => 
        dispatch({ type: 'SET_ERROR', payload: error }), [dispatch]);
    
    const resetState = useCallback(() => 
        dispatch({ type: 'RESET_STATE' }), [dispatch]);

    const ensureRobotsLoaded = useCallback(async () => {
        if (state.robots.length === 0 && !loadingRef.current.robots) {
            loadingRef.current.robots = true;
            try {
                const result = await window.electronAPI.manageRobots.loadRobots();
                if (isSuccess(result)) {
                    const robots = result.data.map(robot => new Robot(robot.ipAddress, robot.port));
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

    const contextValue = useMemo(() => ({
        ...state,
        setTheme,
        setUserAge,
        setSelectedRobot,
        setSelectedMode,
        setRobotsList,
        setLoading,
        setError,
        resetState,
        ensureRobotsLoaded,
        ensureThemeLoaded
    }), [state, setTheme, setUserAge, setSelectedRobot, setSelectedMode, setRobotsList, setLoading, setError, resetState, ensureRobotsLoaded, ensureThemeLoaded]);

    return <AppContext.Provider value={contextValue}>
        {children}
    </AppContext.Provider>;
}
