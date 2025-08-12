import { useCallback, useEffect } from 'react';
import { type Edge, type Node, useEdgesState, useNodesState } from 'reactflow';

const NODES_STORAGE_KEY = 'visual-programming-nodes';
const EDGES_STORAGE_KEY = 'visual-programming-edges';

export const usePersistedNodesState = () => {
  const getInitialNodes = (): Node[] => {
    try {
      const saved = localStorage.getItem(NODES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const getInitialEdges = (): Edge[] => {
    try {
      const saved = localStorage.getItem(EDGES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());

  useEffect(() => {
    try {
      localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
    } catch (error) {
      console.warn('Failed to persist nodes to localStorage:', error);
    }
  }, [nodes]);

  useEffect(() => {
    try {
      localStorage.setItem(EDGES_STORAGE_KEY, JSON.stringify(edges));
    } catch (error) {
      console.warn('Failed to persist edges to localStorage:', error);
    }
  }, [edges]);

  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(NODES_STORAGE_KEY);
      localStorage.removeItem(EDGES_STORAGE_KEY);
      setNodes([]);
      setEdges([]);
    } catch (error) {
      console.warn('Failed to clear persisted state:', error);
    }
  }, [setNodes, setEdges]);

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    clearPersistedState,
  };
};
