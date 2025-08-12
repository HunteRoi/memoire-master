import type { Node } from 'reactflow';

import { ScriptExecutionState } from '../containers/visualProgramming/scriptExecutionContainer';

/**
 * Enhanced node creation with execution highlighting
 */
export const createEnhancedNode = (
  node: Node,
  currentlyExecutingNodeId: string | null,
  blockNames: Record<string, string>
): Node => {
  let updatedLabel = node.data?.label;
  if (node.data?.blockType && node.data?.blockIcon) {
    const translatedBlockName = blockNames[node.data.blockType];
    if (translatedBlockName) {
      updatedLabel = `${node.data.blockIcon} ${translatedBlockName}`;
    }
  }

  const isExecuting = node.id === currentlyExecutingNodeId;

  return {
    ...node,
    data: {
      ...node.data,
      label: updatedLabel,
      blockName: blockNames[node.data?.blockType] || node.data?.blockName,
    },
    style: {
      ...node.style,
      backgroundColor: isExecuting ? '#ffd54f' : node.style?.backgroundColor,
      border: isExecuting ? '2px solid #ff9800' : node.style?.border,
      boxShadow: isExecuting ? '0 4px 8px rgba(255, 152, 0, 0.3)' : node.style?.boxShadow,
    },
  };
};

/**
 * Common execution state update with alert
 */
export interface ExecutionStateUpdate {
  state: ScriptExecutionState;
  alertMessage: string;
  alertType: 'success' | 'info' | 'warning' | 'error';
  clearCurrentNode?: boolean;
}

/**
 * Execution alert messages
 */
export const createExecutionAlerts = (t: (key: string) => string) => ({
  scriptStarted: {
    state: ScriptExecutionState.RUNNING,
    alertMessage: t('visualProgramming.alerts.scriptStarted'),
    alertType: 'success' as const,
  },
  scriptResumed: {
    state: ScriptExecutionState.RUNNING,
    alertMessage: t('visualProgramming.alerts.scriptResumed'),
    alertType: 'success' as const,
  },
  scriptPaused: {
    state: ScriptExecutionState.PAUSED,
    alertMessage: t('visualProgramming.alerts.scriptPaused'),
    alertType: 'info' as const,
    clearCurrentNode: false,
  },
  scriptPausing: {
    alertMessage: t('visualProgramming.alerts.scriptPausing'),
    alertType: 'info' as const,
  },
  scriptStopped: {
    state: ScriptExecutionState.IDLE,
    alertMessage: t('visualProgramming.alerts.scriptStopped'),
    alertType: 'info' as const,
    clearCurrentNode: true,
  },
});

/**
 * Console message types
 */
export const createConsoleMessages = () => ({
  scriptCompleted: {
    type: 'success' as const,
    key: 'visualProgramming.console.scriptCompleted',
  },
  scriptFailed: {
    type: 'error' as const,
    key: 'visualProgramming.console.scriptFailed',
  },
  scriptStoppedByUser: {
    type: 'info' as const,
    key: 'visualProgramming.console.scriptStoppedByUser',
  },
  executingBlock: {
    type: 'info' as const,
    key: 'visualProgramming.console.executingBlock',
  },
});
