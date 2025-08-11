import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { BlocksPanelLabels } from '../../components/visualProgramming/blocksPanel';
import type { ConsolePanelLabels } from '../../components/visualProgramming/consolePanel';
import type { ScriptPanelLabels } from '../../components/visualProgramming/scriptPanel';

export interface VisualProgrammingLabels {
  blocksPanelLabels: BlocksPanelLabels;
  consolePanelLabels: ConsolePanelLabels;
  scriptPanelLabels: ScriptPanelLabels;
  errorMessages: {
    invalidBlockData: string;
    invalidBlockStructure: string;
    failedToAddBlock: string;
  };
  successMessages: {
    blockAdded: (blockName: string) => string;
    blockDeleted: (blockName: string) => string;
  };
}

const LabelsContext = createContext<VisualProgrammingLabels | null>(null);

export const useVisualProgrammingLabels = (): VisualProgrammingLabels => {
  const context = useContext(LabelsContext);
  if (!context) {
    throw new Error(
      'useVisualProgrammingLabels must be used within a LabelsProvider'
    );
  }
  return context;
};

interface LabelsProviderProps {
  children: ReactNode;
}

export const LabelsProvider: React.FC<LabelsProviderProps> = ({ children }) => {
  const { t } = useTranslation();

  const blocksPanelLabels = useMemo<BlocksPanelLabels>(
    () => ({
      title: t('visualProgramming.blocks.title'),
      categories: {
        movement: t('visualProgramming.blocks.categories.movement'),
        sound: t('visualProgramming.blocks.categories.sound'),
        leds: t('visualProgramming.blocks.categories.leds'),
        sensors: t('visualProgramming.blocks.categories.sensors'),
        control: t('visualProgramming.blocks.categories.control'),
      },
      blockNames: {
        move_forward: t('visualProgramming.blocks.names.move_forward'),
        move_backward: t('visualProgramming.blocks.names.move_backward'),
        turn_left: t('visualProgramming.blocks.names.turn_left'),
        turn_right: t('visualProgramming.blocks.names.turn_right'),
        stop: t('visualProgramming.blocks.names.stop'),
        play_beep: t('visualProgramming.blocks.names.play_beep'),
        play_melody: t('visualProgramming.blocks.names.play_melody'),
        set_volume: t('visualProgramming.blocks.names.set_volume'),
        set_led_color: t('visualProgramming.blocks.names.set_led_color'),
        set_led_rgb: t('visualProgramming.blocks.names.set_led_rgb'),
        blink_leds: t('visualProgramming.blocks.names.blink_leds'),
        floor_sensor: t('visualProgramming.blocks.names.floor_sensor'),
        distance_sensor: t('visualProgramming.blocks.names.distance_sensor'),
        light_sensor: t('visualProgramming.blocks.names.light_sensor'),
        wait: t('visualProgramming.blocks.names.wait'),
        if_condition: t('visualProgramming.blocks.names.if_condition'),
        while_loop: t('visualProgramming.blocks.names.while_loop'),
        repeat: t('visualProgramming.blocks.names.repeat'),
      },
      blockDescriptions: {
        move_forward: t('visualProgramming.blocks.descriptions.move_forward'),
        move_backward: t('visualProgramming.blocks.descriptions.move_backward'),
        turn_left: t('visualProgramming.blocks.descriptions.turn_left'),
        turn_right: t('visualProgramming.blocks.descriptions.turn_right'),
        stop: t('visualProgramming.blocks.descriptions.stop'),
        play_beep: t('visualProgramming.blocks.descriptions.play_beep'),
        play_melody: t('visualProgramming.blocks.descriptions.play_melody'),
        set_volume: t('visualProgramming.blocks.descriptions.set_volume'),
        set_led_color: t('visualProgramming.blocks.descriptions.set_led_color'),
        set_led_rgb: t('visualProgramming.blocks.descriptions.set_led_rgb'),
        blink_leds: t('visualProgramming.blocks.descriptions.blink_leds'),
        floor_sensor: t('visualProgramming.blocks.descriptions.floor_sensor'),
        distance_sensor: t(
          'visualProgramming.blocks.descriptions.distance_sensor'
        ),
        light_sensor: t('visualProgramming.blocks.descriptions.light_sensor'),
        wait: t('visualProgramming.blocks.descriptions.wait'),
        if_condition: t('visualProgramming.blocks.descriptions.if_condition'),
        while_loop: t('visualProgramming.blocks.descriptions.while_loop'),
        repeat: t('visualProgramming.blocks.descriptions.repeat'),
      },
    }),
    [t]
  );

  const consolePanelLabels = useMemo<ConsolePanelLabels>(
    () => ({
      title: t('visualProgramming.console.title'),
      showConsole: t('visualProgramming.console.showConsole'),
      messages: {
        robotInitialized: t(
          'visualProgramming.console.messages.robotInitialized'
        ),
        connecting: t('visualProgramming.console.messages.connecting'),
      },
    }),
    [t]
  );

  const scriptPanelLabels = useMemo<ScriptPanelLabels>(
    () => ({
      title: t('visualProgramming.script.title'),
      status: {
        running: t('visualProgramming.script.status.running'),
        paused: t('visualProgramming.script.status.paused'),
        idle: t('visualProgramming.script.status.idle'),
      },
    }),
    [t]
  );

  const errorMessages = useMemo(
    () => ({
      invalidBlockData: t('visualProgramming.errors.invalidBlockData'),
      invalidBlockStructure: t(
        'visualProgramming.errors.invalidBlockStructure'
      ),
      failedToAddBlock: t('visualProgramming.errors.failedToAddBlock'),
    }),
    [t]
  );

  const successMessages = useMemo(
    () => ({
      blockAdded: (blockName: string) =>
        t('visualProgramming.success.blockAdded', { blockName }),
      blockDeleted: (blockName: string) =>
        t('visualProgramming.success.blockDeleted', { blockName }),
    }),
    [t]
  );

  const labels = useMemo<VisualProgrammingLabels>(
    () => ({
      blocksPanelLabels,
      consolePanelLabels,
      scriptPanelLabels,
      errorMessages,
      successMessages,
    }),
    [
      blocksPanelLabels,
      consolePanelLabels,
      scriptPanelLabels,
      errorMessages,
      successMessages,
    ]
  );

  return (
    <LabelsContext.Provider value={labels}>{children}</LabelsContext.Provider>
  );
};
