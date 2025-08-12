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
        defaultValue: 50,
        min: 1,
        max: 100,
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
        defaultValue: 50,
        min: 1,
        max: 100,
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
        defaultValue: 50,
        min: 1,
        max: 100,
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
        defaultValue: 50,
        min: 1,
        max: 100,
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
        id: 'frequency',
        name: 'Frequency',
        type: 'number',
        defaultValue: 440,
        min: 100,
        max: 2000,
        unit: 'Hz',
      },
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
      'robot.play_beep(frequency={{frequency}}, duration={{duration}})',
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
    id: 'set_volume',
    name: 'Set Volume',
    icon: '🔉',
    category: 'sound',
    description: 'Set the speaker volume',
    parameters: [
      {
        id: 'volume',
        name: 'Volume',
        type: 'number',
        defaultValue: 50,
        min: 0,
        max: 100,
        unit: '%',
      },
    ],
    pythonTemplate: 'robot.set_volume({{volume}})',
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
    id: 'set_led_color',
    name: 'Set LED Color',
    icon: '💡',
    category: 'leds',
    description: 'Set LED to a specific color',
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
          { value: 'purple', label: 'Purple' },
          { value: 'cyan', label: 'Cyan' },
          { value: 'white', label: 'White' },
          { value: 'off', label: 'Turn Off' },
        ],
      },
    ],
    pythonTemplate: 'robot.set_led_color("{{led_id}}", "{{color}}")',
  },
  {
    id: 'set_led_rgb',
    name: 'Set LED RGB',
    icon: '🌈',
    category: 'leds',
    description: 'Set LED with custom RGB values',
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
        id: 'red',
        name: 'Red',
        type: 'number',
        defaultValue: 255,
        min: 0,
        max: 255,
      },
      {
        id: 'green',
        name: 'Green',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 255,
      },
      {
        id: 'blue',
        name: 'Blue',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 255,
      },
    ],
    pythonTemplate:
      'robot.set_led_rgb("{{led_id}}", {{red}}, {{green}}, {{blue}})',
  },
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
    id: 'floor_sensor',
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
    id: 'distance_sensor',
    name: 'Distance Sensor',
    icon: '📡',
    category: 'sensors',
    description: 'Measure distance to obstacles',
    parameters: [
      {
        id: 'max_distance',
        name: 'Max Distance',
        type: 'number',
        defaultValue: 50,
        min: 1,
        max: 200,
        unit: 'cm',
      },
    ],
    pythonTemplate: 'robot.get_distance(max_distance={{max_distance}})',
  },
  {
    id: 'light_sensor',
    name: 'Light Sensor',
    icon: '🌞',
    category: 'sensors',
    description: 'Measure ambient light level',
    pythonTemplate: 'robot.get_light_level()',
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
