import type { Node } from 'reactflow';

export const validateExecution = (
  hasConnectedRobot: boolean,
  nodeCount: number,
  t: any
): string | null => {
  if (!hasConnectedRobot) {
    return t('visualProgramming.alerts.noRobotConnected');
  }
  if (nodeCount === 0) {
    return t('visualProgramming.alerts.noBlocksInScript');
  }
  return null;
};

export const validateNode = (node: Node, index: number): boolean => {
  if (!node?.data?.blockType || !node?.data?.blockName) {
    console.warn(`Skipping invalid node at index ${index}:`, node);
    return false;
  }
  return true;
};
