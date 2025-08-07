export interface Block {
  id: string;
  name: string;
  icon: string;
}

export interface BlockCategory {
  id: string;
  name: string;
  blocks: Block[];
}

export const blockCategories: BlockCategory[] = [
  {
    id: 'movement',
    name: 'Movement',
    blocks: [
      { id: 'move_forward', name: 'Move Forward', icon: '↑' },
      { id: 'move_backward', name: 'Move Backward', icon: '↓' },
      { id: 'turn_left', name: 'Turn Left', icon: '↰' },
      { id: 'turn_right', name: 'Turn Right', icon: '↱' },
    ]
  },
  {
    id: 'sensors',
    name: 'Sensors',
    blocks: [
      { id: 'distance_sensor', name: 'Distance Sensor', icon: '📏' },
      { id: 'light_sensor', name: 'Light Sensor', icon: '💡' },
      { id: 'camera', name: 'Camera', icon: '📷' },
    ]
  },
  {
    id: 'control',
    name: 'Control',
    blocks: [
      { id: 'if_condition', name: 'If Condition', icon: '❓' },
      { id: 'while_loop', name: 'While Loop', icon: '🔄' },
      { id: 'wait', name: 'Wait', icon: '⏸️' },
    ]
  },
];