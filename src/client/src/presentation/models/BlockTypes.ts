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
