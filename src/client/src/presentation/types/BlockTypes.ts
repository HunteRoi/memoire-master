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

// Block categories with translation keys
export const blockCategoryIds = ['movement', 'sensors', 'control'] as const;
export const blockIds = [
  'move_forward',
  'move_backward',
  'turn_left',
  'turn_right',
  'distance_sensor',
  'light_sensor',
  'camera',
  'if_condition',
  'while_loop',
  'wait',
] as const;

export const blockCategoryDefinitions = [
  {
    id: 'movement',
    blocks: [
      { id: 'move_forward', icon: '↑' },
      { id: 'move_backward', icon: '↓' },
      { id: 'turn_left', icon: '↰' },
      { id: 'turn_right', icon: '↱' },
    ],
  },
  {
    id: 'sensors',
    blocks: [
      { id: 'distance_sensor', icon: '📏' },
      { id: 'light_sensor', icon: '💡' },
      { id: 'camera', icon: '📷' },
    ],
  },
  {
    id: 'control',
    blocks: [
      { id: 'if_condition', icon: '❓' },
      { id: 'while_loop', icon: '🔄' },
      { id: 'wait', icon: '⏸️' },
    ],
  },
] as const;

// Helper function to get translated categories (use this in components)
export const getTranslatedBlockCategories = (t: any): BlockCategory[] => {
  return blockCategoryDefinitions.map(category => ({
    id: category.id,
    name: t(`visualProgramming.blocks.categories.${category.id}`),
    blocks: category.blocks.map(block => ({
      id: block.id,
      name: t(`visualProgramming.blocks.names.${block.id}`),
      icon: block.icon,
    })),
  }));
};
