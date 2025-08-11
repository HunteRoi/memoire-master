import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

import type { RobotFeedback } from '../../../domain/robot';
import { usePersistedConsoleState } from '../../hooks/usePersistedConsoleState';
import { useRobotTranslations } from '../../hooks/useRobotTranslations';
import type { ConsoleMessage } from '../../models/ConsoleMessage';
import { useVisualProgrammingLabels } from '../../providers/visualProgramming/labelsProvider';

export interface ConsoleContextType {
  consoleMessages: ConsoleMessage[];
  showConsole: boolean;
  handleFeedback: (feedback: RobotFeedback) => void;
  addConsoleMessage: (
    type: string,
    translationKey: string,
    translationParams?: Record<string, any>
  ) => void;
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
  isSimpleMode,
}) => {
  const { t } = useTranslation();
  const { translateFeedbackMessage } = useRobotTranslations();
  const { blocksPanelLabels } = useVisualProgrammingLabels();
  const { consoleMessages, setConsoleMessages, showConsole, setShowConsole } =
    usePersistedConsoleState({ isSimpleMode });

  // Re-translate all messages when language changes
  useEffect(() => {
    setConsoleMessages(prevMessages =>
      prevMessages.map(msg => {
        let finalTranslationParams = msg.translationParams || {};

        // Handle block ID translation for re-translation
        if (msg.translationParams?.blockId) {
          const translatedBlockName =
            blocksPanelLabels.blockNames[msg.translationParams.blockId];
          finalTranslationParams = {
            ...msg.translationParams,
            blockName: translatedBlockName || msg.translationParams.blockId,
          };
        }

        return {
          ...msg,
          translationParams: finalTranslationParams,
          message: String(t(msg.translationKey, finalTranslationParams)),
        };
      })
    );
  }, [t, blocksPanelLabels.blockNames, setConsoleMessages]);

  // Console management functions
  const handleFeedback = useCallback(
    (feedback: RobotFeedback) => {
      // Extract message parameters if they exist in the feedback data
      const messageParams = feedback.data?.messageParams || {};
      const translatedMessage = translateFeedbackMessage(
        feedback.message,
        messageParams
      );

      setConsoleMessages(prev => [
        ...prev,
        {
          timestamp: feedback.timestamp,
          type: feedback.type,
          translationKey: feedback.message,
          translationParams: messageParams,
          message: translatedMessage,
        },
      ]);
    },
    [translateFeedbackMessage, setConsoleMessages]
  );

  const addConsoleMessage = useCallback(
    (
      type: string,
      translationKey: string,
      translationParams?: Record<string, any>
    ) => {
      // Handle block ID translation for console messages
      let finalTranslationParams = translationParams || {};
      if (translationParams?.blockId) {
        const translatedBlockName =
          blocksPanelLabels.blockNames[translationParams.blockId];
        finalTranslationParams = {
          ...translationParams,
          blockName: translatedBlockName || translationParams.blockId,
        };
      }

      setConsoleMessages(prev => [
        ...prev,
        {
          timestamp: Date.now(),
          type,
          translationKey,
          translationParams: finalTranslationParams,
          message: String(t(translationKey, finalTranslationParams)),
        },
      ]);
    },
    [t, blocksPanelLabels.blockNames, setConsoleMessages]
  );

  const handleToggleConsole = useCallback(() => {
    setShowConsole(prev => !prev);
  }, [setShowConsole]);

  const contextValue = useMemo<ConsoleContextType>(
    () => ({
      consoleMessages,
      showConsole,
      handleFeedback,
      addConsoleMessage,
      handleToggleConsole,
    }),
    [
      consoleMessages,
      showConsole,
      handleFeedback,
      addConsoleMessage,
      handleToggleConsole,
    ]
  );

  return (
    <ConsoleContext.Provider value={contextValue}>
      {children}
    </ConsoleContext.Provider>
  );
};
