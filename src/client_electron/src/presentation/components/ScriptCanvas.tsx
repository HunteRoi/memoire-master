import React from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@mui/material';
import { Block } from '../../domain/entities/Block';

interface ScriptCanvasProps {
  blocks: Block[];
}

export const ScriptCanvas: React.FC<ScriptCanvasProps> = ({
  blocks = []
}) => {
  const initialNodes: Node[] = blocks.map((block, index) => ({
    id: block.name,
    type: 'default',
    position: { x: index * 200, y: index * 100 },
    data: {
      label: `${block.type}: ${block.value || 'Empty'}`,
      block
    },
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = (connection: Edge | Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  };

  return (
    <Box sx={{ height: '500px', width: '100%', border: '1px solid #ddd' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </Box>
  );
};
