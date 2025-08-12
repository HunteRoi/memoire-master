import type { Edge, Node } from 'reactflow';

export const getExecutionOrder = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0) return [];

  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach(edge => {
    if (
      edge.source &&
      edge.target &&
      adjacencyList.has(edge.source) &&
      inDegree.has(edge.target)
    ) {
      adjacencyList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
  }

  const sortedIds: string[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    sortedIds.push(currentId);

    const neighbors = adjacencyList.get(currentId) || [];
    neighbors.forEach(neighborId => {
      const newInDegree = inDegree.get(neighborId)! - 1;
      inDegree.set(neighborId, newInDegree);

      if (newInDegree === 0) {
        queue.push(neighborId);
      }
    });
  }

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const sortedNodes = sortedIds
    .map(id => nodeMap.get(id)!)
    .filter(node => node);

  const processedIds = new Set(sortedIds);
  const disconnectedNodes = nodes.filter(
    node => !processedIds.has(node.id)
  );

  return [...sortedNodes, ...disconnectedNodes];
};