import { useCallback, useEffect } from 'react';
import { type Node, type Edge, useNodesState, useEdgesState } from 'reactflow';

const NODES_STORAGE_KEY = 'visual-programming-nodes';
const EDGES_STORAGE_KEY = 'visual-programming-edges';

export const usePersistedNodesState = () => {
  // Load initial state from localStorage
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

  // Use React Flow hooks with persisted initial values
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());

  // Persist nodes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
    } catch (error) {
      console.warn('Failed to persist nodes to localStorage:', error);
    }
  }, [nodes]);

  // Persist edges to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(EDGES_STORAGE_KEY, JSON.stringify(edges));
    } catch (error) {
      console.warn('Failed to persist edges to localStorage:', error);
    }
  }, [edges]);

  // Clear persisted state
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