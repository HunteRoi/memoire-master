import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { RobotFeedback } from '../../../domain/robot';
import type { ConsoleMessage } from '../../models/ConsoleMessage';
import { useRobotTranslations } from '../../hooks/useRobotTranslations';

export interface ConsoleContextType {
  consoleMessages: ConsoleMessage[];
  showConsole: boolean;
  handleFeedback: (feedback: RobotFeedback) => void;
  addConsoleMessage: (type: string, message: string) => void;
  handleToggleConsole: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | null>(null);

export const useConsole = (): ConsoleContextType => {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error('useConsole must be used within a ConsoleContainer');
  }
  return context;
};

interface ConsoleContainerProps {
  children: ReactNode;
  isSimpleMode: boolean;
}

export const ConsoleContainer: React.FC<ConsoleContainerProps> = ({
  children,
  isSimpleMode
}) => {
  const { t } = useTranslation();
  const { translateFeedbackMessage } = useRobotTranslations();
  const [showConsole, setShowConsole] = useState(!isSimpleMode);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const initializationMessage = useMemo(() => t('visualProgramming.console.messages.robotInitialized'), [t]);

  useEffect(() => {
    setConsoleMessages([
      {
        timestamp: Date.now(),
        type: 'info',
        message: initializationMessage,
      },
    ]);
  }, [initializationMessage]);

  // Console management functions
  const handleFeedback = useCallback((feedback: RobotFeedback) => {
    // Extract message parameters if they exist in the feedback data
    const messageParams = feedback.data?.messageParams || {};
    const translatedMessage = translateFeedbackMessage(feedback.message, messageParams);

    setConsoleMessages(prev => [
      ...prev,
      {
        timestamp: feedback.timestamp,
        type: feedback.type,
        message: translatedMessage,
      },
    ]);
  }, [translateFeedbackMessage]);

  const addConsoleMessage = useCallback((type: string, message: string) => {
    setConsoleMessages(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        type,
        message,
      },
    ]);
  }, []);

  const handleToggleConsole = useCallback(() => {
    setShowConsole(prev => !prev);
  }, []);

  const contextValue = useMemo<ConsoleContextType>(
    () => ({
      consoleMessages,
      showConsole,
      handleFeedback,
      addConsoleMessage,
      handleToggleConsole,
    }),
    [consoleMessages, showConsole, handleFeedback, addConsoleMessage, handleToggleConsole]
  );

  return (
    <ConsoleContext.Provider value={contextValue}>
      {children}
    </ConsoleContext.Provider>
  );
};
