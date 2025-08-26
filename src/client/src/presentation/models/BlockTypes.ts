export interface BlockParameter {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  defaultValue: unknown;
  min?: number;
  max?: number;
  options?: { value: unknown; label: string }[];
  unit?: string;
}

export interface Block {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  parameters?: BlockParameter[];
  pythonTemplate: string; // Template for Python code generation
}

export interface BlockCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  blocks: Block[];
}

export const blockCategoryIds = [
  'movement',
  'sound',
  'leds',
  'sensors',
] as const;

export const movementBlocks: Block[] = [
  {
    id: 'move_forward',
    name: 'visualProgramming.blocks.names.move_forward',
    icon: '⬆️',
    category: 'movement',
    description: 'visualProgramming.blocks.descriptions.move_forward',
    parameters: [
      {
        id: 'speed',
        name: 'Speed',
        type: 'number',
        defaultValue: 200,
        min: 1,
        max: 2000,
        unit: '%',
      },
      {
        id: 'duration',
        name: 'Duration',
        type: 'number',
        defaultValue: 1,
        min: 0.1,
        max: 10,
        unit: 'sec',
      },
    ],
    pythonTemplate:
      'robot.move_forward(speed={{speed}}, duration={{duration}})',
  },
  {
    id: 'move_backward',
    name: 'visualProgramming.blocks.names.move_backward',
    icon: '⬇️',
    category: 'movement',
    description: 'visualProgramming.blocks.descriptions.move_backward',
    parameters: [
      {
        id: 'speed',
        name: 'Speed',
        type: 'number',
        defaultValue: 200,
        min: 1,
        max: 2000,
        unit: '%',
      },
      {
        id: 'duration',
        name: 'Duration',
        type: 'number',
        defaultValue: 1,
        min: 0.1,
        max: 10,
        unit: 'sec',
      },
    ],
    pythonTemplate:
      'robot.move_backward(speed={{speed}}, duration={{duration}})',
  },
  {
    id: 'turn_left',
    name: 'Turn Left',
    icon: '⬅️',
    category: 'movement',
    description: 'Turn the robot left',
    parameters: [
      {
        id: 'angle',
        name: 'Angle',
        type: 'number',
        defaultValue: 90,
        min: 1,
        max: 360,
        unit: '°',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'number',
        defaultValue: 200,
        min: 1,
        max: 2000,
        unit: '%',
      },
    ],
    pythonTemplate: 'robot.turn_left(angle={{angle}}, speed={{speed}})',
  },
  {
    id: 'turn_right',
    name: 'Turn Right',
    icon: '➡️',
    category: 'movement',
    description: 'Turn the robot right',
    parameters: [
      {
        id: 'angle',
        name: 'Angle',
        type: 'number',
        defaultValue: 90,
        min: 1,
        max: 360,
        unit: '°',
      },
      {
        id: 'speed',
        name: 'Speed',
        type: 'number',
        defaultValue: 200,
        min: 1,
        max: 2000,
        unit: '%',
      },
    ],
    pythonTemplate: 'robot.turn_right(angle={{angle}}, speed={{speed}})',
  },
  {
    id: 'stop',
    name: 'Stop',
    icon: '⏹️',
    category: 'movement',
    description: 'Stop all robot movement',
    pythonTemplate: 'robot.stop()',
  },
];

export const soundBlocks: Block[] = [
  {
    id: 'play_beep',
    name: 'Play Beep',
    icon: '🔊',
    category: 'sound',
    description: 'Play a beep sound',
    parameters: [
      {
        id: 'duration',
        name: 'Duration',
        type: 'number',
        defaultValue: 0.5,
        min: 0.1,
        max: 5,
        unit: 'sec',
      },
    ],
    pythonTemplate:
      'robot.play_beep(duration={{duration}})',
  },
  {
    id: 'play_melody',
    name: 'Play Melody',
    icon: '🎵',
    category: 'sound',
    description: 'Play a predefined melody',
    parameters: [
      {
        id: 'melody',
        name: 'Melody',
        type: 'select',
        defaultValue: 'happy',
        options: [
          { value: 'happy', label: 'Happy Tune' },
          { value: 'sad', label: 'Sad Tune' },
          { value: 'victory', label: 'Victory Fanfare' },
          { value: 'alarm', label: 'Alarm Sound' },
        ],
      },
    ],
    pythonTemplate: 'robot.play_melody("{{melody}}")',
  },
  {
    id: 'stop_melody',
    name: 'Stop Melody',
    icon: '🔇',
    category: 'sound',
    description: 'Stop any currently playing melody or sound',
    pythonTemplate: 'robot.stop_melody()',
  },
];

export const ledBlocks: Block[] = [
  {
    id: 'blink_leds',
    name: 'Blink LEDs',
    icon: '✨',
    category: 'leds',
    description: 'Make LEDs blink',
    parameters: [
      {
        id: 'led_id',
        name: 'LED',
        type: 'select',
        defaultValue: 'all',
        options: [
          { value: 'all', label: 'All LEDs' },
          { value: 'front', label: 'Front LED' },
          { value: 'body', label: 'Body LED' },
          { value: 'left', label: 'Left LED' },
          { value: 'right', label: 'Right LED' },
        ],
      },
      {
        id: 'color',
        name: 'Color',
        type: 'select',
        defaultValue: 'red',
        options: [
          { value: 'red', label: 'Red' },
          { value: 'green', label: 'Green' },
          { value: 'blue', label: 'Blue' },
          { value: 'yellow', label: 'Yellow' },
          { value: 'white', label: 'White' },
        ],
      },
      {
        id: 'times',
        name: 'Times',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 10,
      },
      {
        id: 'interval',
        name: 'Interval',
        type: 'number',
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        unit: 'sec',
      },
    ],
    pythonTemplate:
      'robot.blink_leds("{{led_id}}", "{{color}}", {{times}}, {{interval}})',
  },
];

export const sensorBlocks: Block[] = [
  {
    id: 'read_ground',
    name: 'Floor Color Sensor',
    icon: '🔍',
    category: 'sensors',
    description: 'Detect floor color (white tile detection)',
    parameters: [
      {
        id: 'target_color',
        name: 'Target Color',
        type: 'select',
        defaultValue: 'white',
        options: [
          { value: 'white', label: 'White' },
          { value: 'black', label: 'Black' },
          { value: 'gray', label: 'Gray' },
        ],
      },
      {
        id: 'sensitivity',
        name: 'Sensitivity',
        type: 'number',
        defaultValue: 50,
        min: 1,
        max: 100,
        unit: '%',
      },
    ],
    pythonTemplate:
      'robot.detect_floor_color("{{target_color}}", sensitivity={{sensitivity}})',
  },
  {
    id: 'read_battery',
    name: 'Read Battery',
    icon: '🔋',
    category: 'sensors',
    description: 'Get robot battery level and voltage information',
    pythonTemplate: 'robot.read_battery()',
  },
];

export const blockIds = [
  ...movementBlocks.map(b => b.id),
  ...soundBlocks.map(b => b.id),
  ...ledBlocks.map(b => b.id),
  ...sensorBlocks.map(b => b.id),
] as const;

export const blockCategories: BlockCategory[] = [
  {
    id: 'movement',
    name: 'visualProgramming.blocks.categories.movement',
    icon: '🚶',
    color: '#4CAF50',
    blocks: movementBlocks,
  },
  {
    id: 'sound',
    name: 'visualProgramming.blocks.categories.sound',
    icon: '🔊',
    color: '#FF9800',
    blocks: soundBlocks,
  },
  {
    id: 'leds',
    name: 'visualProgramming.blocks.categories.leds',
    icon: '💡',
    color: '#2196F3',
    blocks: ledBlocks,
  },
  {
    id: 'sensors',
    name: 'visualProgramming.blocks.categories.sensors',
    icon: '🔍',
    color: '#9C27B0',
    blocks: sensorBlocks,
  },
];
