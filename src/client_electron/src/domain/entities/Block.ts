export enum BlockCategory {
  MOVEMENT = 'movement',
  SENSOR = 'sensor',
  SOUND = 'sound',
  CONTROL = 'control',
  LOGIC = 'logic'
}

export enum BlockType {
  // Movement blocks
  MOVE_FORWARD = 'move_forward',
  MOVE_BACKWARD = 'move_backward',
  TURN_LEFT = 'turn_left',
  TURN_RIGHT = 'turn_right',
  STOP = 'stop',

  // Sensor blocks
  READ_DISTANCE = 'read_distance',
  READ_LIGHT = 'read_light',
  READ_SOUND = 'read_sound',

  // Sound blocks
  PLAY_BEEP = 'play_beep',
  PLAY_MELODY = 'play_melody',

  // Control blocks
  WAIT = 'wait',
  REPEAT = 'repeat',
  IF = 'if',

  // Logic blocks
  COMPARE = 'compare',
  AND = 'and',
  OR = 'or'
}

type BlockParameterValue = number | string | boolean;
export interface BlockParameter {
  name: string;
  type: 'number' | 'string' | 'boolean';
  value: BlockParameterValue;
  min?: number;
  max?: number;
}

export class Block {
  constructor(
    public readonly type: BlockType,
    public readonly category: BlockCategory,
    public readonly name: string,
    public readonly description: string,
    public readonly value: string = '',
    public parameters: BlockParameter[] = []
  ) { }

  static create(
    type: BlockType,
    category: BlockCategory,
    name: string,
    description: string,
    value: string,
    parameters: BlockParameter[] = []
  ): Block {
    return new Block(
      type,
      category,
      name,
      description,
      value,
      parameters
    );
  }

  updateParameter(parameterName: string, value: BlockParameterValue): Block {
    const updatedParameters = this.parameters.map(param =>
      param.name === parameterName ? { ...param, value } : param
    );

    return new Block(
      this.type,
      this.category,
      this.name,
      this.description,
      this.value,
      updatedParameters
    );
  }

  getParameter(name: string): BlockParameter | undefined {
    return this.parameters.find(param => param.name === name);
  }

  toCommand(): string {
    switch (this.type) {
      case BlockType.MOVE_FORWARD: {
        const distance = this.getParameter('distance')?.value || 100;
        return `move_forward(${distance})`;
      }
      case BlockType.MOVE_BACKWARD: {
        const backDistance = this.getParameter('distance')?.value || 100;
        return `move_backward(${backDistance})`;
      }
      case BlockType.TURN_LEFT: {
        const leftAngle = this.getParameter('angle')?.value || 90;
        return `turn_left(${leftAngle})`;
      }
      case BlockType.TURN_RIGHT: {
        const rightAngle = this.getParameter('angle')?.value || 90;
        return `turn_right(${rightAngle})`;
      }
      case BlockType.STOP:
        return 'stop()';
      case BlockType.WAIT: {
        const duration = this.getParameter('duration')?.value || 1000;
        return `wait(${duration})`;
      }
      default:
        return `${this.type}()`;
    }
  }
}
