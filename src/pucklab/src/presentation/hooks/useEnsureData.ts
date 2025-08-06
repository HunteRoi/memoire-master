import { useEffect } from 'react';
import { useAppContext } from './useAppContext';

export const useEnsureData = () => {
  const { ensureRobotsLoaded, ensureThemeLoaded } = useAppContext();
  
  useEffect(() => {
    console.log('🔄 useEnsureData: Ensuring data is loaded...');
    ensureThemeLoaded();
    ensureRobotsLoaded();
  }, [ensureThemeLoaded, ensureRobotsLoaded]);
};