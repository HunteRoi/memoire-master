import { useCallback, useEffect, useState } from 'react';
import type { ConsoleMessage } from '../models/ConsoleMessage';

const CONSOLE_MESSAGES_STORAGE_KEY = 'visual-programming-console-messages';
const CONSOLE_VISIBILITY_STORAGE_KEY = 'visual-programming-console-visibility';

interface UsePersistedConsoleStateProps {
  isSimpleMode: boolean;
}

export const usePersistedConsoleState = ({ isSimpleMode }: UsePersistedConsoleStateProps) => {
  // Load initial console messages from localStorage
  const getInitialMessages = (): ConsoleMessage[] => {
    try {
      const saved = localStorage.getItem(CONSOLE_MESSAGES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Load initial console visibility from localStorage
  const getInitialVisibility = (): boolean => {
    try {
      const saved = localStorage.getItem(CONSOLE_VISIBILITY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : !isSimpleMode;
    } catch {
      return !isSimpleMode;
    }
  };

  // State hooks with persisted initial values
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>(getInitialMessages());
  const [showConsole, setShowConsole] = useState<boolean>(getInitialVisibility());

  // Persist console messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CONSOLE_MESSAGES_STORAGE_KEY, JSON.stringify(consoleMessages));
    } catch (error) {
      console.warn('Failed to persist console messages to localStorage:', error);
    }
  }, [consoleMessages]);

  // Persist console visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CONSOLE_VISIBILITY_STORAGE_KEY, JSON.stringify(showConsole));
    } catch (error) {
      console.warn('Failed to persist console visibility to localStorage:', error);
    }
  }, [showConsole]);

  // Clear persisted console state
  const clearPersistedConsoleState = useCallback(() => {
    try {
      localStorage.removeItem(CONSOLE_MESSAGES_STORAGE_KEY);
      localStorage.removeItem(CONSOLE_VISIBILITY_STORAGE_KEY);
      setConsoleMessages([]);
      setShowConsole(!isSimpleMode);
    } catch (error) {
      console.warn('Failed to clear persisted console state:', error);
    }
  }, [isSimpleMode]);

  return {
    consoleMessages,
    setConsoleMessages,
    showConsole,
    setShowConsole,
    clearPersistedConsoleState,
  };
};