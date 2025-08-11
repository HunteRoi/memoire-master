import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

export interface TutorialContextType {
  isTutorialOpen: boolean;
  startTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  hasSeenTutorial: (tutorialId: string) => boolean;
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

  // Check if user has seen a specific tutorial
  const hasSeenTutorial = useCallback((tutorialId: string): boolean => {
    try {
      const seenTutorials = JSON.parse(
        localStorage.getItem('seen_tutorials') || '{}'
      );
      return Boolean(seenTutorials[tutorialId]);
    } catch {
      return false;
    }
  }, []);

  // Mark tutorial as seen
  const markTutorialAsSeen = useCallback((tutorialId: string) => {
    try {
      const seenTutorials = JSON.parse(
        localStorage.getItem('seen_tutorials') || '{}'
      );
      seenTutorials[tutorialId] = true;
      localStorage.setItem('seen_tutorials', JSON.stringify(seenTutorials));
    } catch (error) {
      console.warn('Failed to save tutorial state:', error);
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

  const contextValue: TutorialContextType = {
    isTutorialOpen,
    startTutorial,
    closeTutorial,
    completeTutorial,
    skipTutorial,
    hasSeenTutorial,
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
};
