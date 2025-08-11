import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface TutorialContextType {
  isTutorialOpen: boolean;
  startTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  hasSeenTutorial: (tutorialId: string) => boolean;
  resetTutorialState: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({
  children,
}) => {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Debug localStorage state on mount
  useEffect(() => {
    console.debug('Tutorial provider initialized. LocalStorage state:', localStorage.getItem('seen_tutorials'));
  }, []);

  // Check if user has seen a specific tutorial
  const hasSeenTutorial = useCallback((tutorialId: string): boolean => {
    try {
      const stored = localStorage.getItem('seen_tutorials');
      if (!stored) {
        return false;
      }
      const seenTutorials = JSON.parse(stored);
      const result = Boolean(seenTutorials[tutorialId]);
      console.debug(`Tutorial check for '${tutorialId}':`, result);
      return result;
    } catch (error) {
      console.warn('Failed to check tutorial state:', error);
      return false;
    }
  }, []);

  // Mark tutorial as seen
  const markTutorialAsSeen = useCallback((tutorialId: string) => {
    try {
      const stored = localStorage.getItem('seen_tutorials') || '{}';
      const seenTutorials = JSON.parse(stored);
      seenTutorials[tutorialId] = true;
      localStorage.setItem('seen_tutorials', JSON.stringify(seenTutorials));
      console.debug(`Tutorial '${tutorialId}' marked as seen`);
    } catch (error) {
      console.error('Failed to save tutorial state:', error);
    }
  }, []);

  const startTutorial = useCallback(() => {
    setIsTutorialOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
  }, []);

  const completeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    markTutorialAsSeen('visual_programming');
  }, [markTutorialAsSeen]);

  const skipTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    markTutorialAsSeen('visual_programming');
  }, [markTutorialAsSeen]);

  const resetTutorialState = useCallback(() => {
    try {
      localStorage.removeItem('seen_tutorials');
      console.debug('Tutorial state reset');
    } catch (error) {
      console.error('Failed to reset tutorial state:', error);
    }
  }, []);

  const contextValue: TutorialContextType = {
    isTutorialOpen,
    startTutorial,
    closeTutorial,
    completeTutorial,
    skipTutorial,
    hasSeenTutorial,
    resetTutorialState,
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
};
