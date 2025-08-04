import { Block } from './Block';

export class Script {
  constructor(
    public readonly name: string,
    public blocks: Block[] = [],
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) { }

  static create(name: string): Script {
    return new Script(name);
  }

  addBlock(block: Block): Script {
    return new Script(
      this.name,
      [...this.blocks, block],
      this.createdAt,
      new Date()
    );
  }

  removeBlock(blockName: string): Script {
    const filteredBlocks = this.blocks.filter(block => block.name !== blockName);

    return new Script(
      this.name,
      filteredBlocks,
      this.createdAt,
      new Date()
    );
  }

  updateBlock(updatedBlock: Block): Script {
    const updatedBlocks = this.blocks.map(block =>
      block.name === updatedBlock.name ? updatedBlock : block
    );

    return new Script(
      this.name,
      updatedBlocks,
      this.createdAt,
      new Date()
    );
  }

  execute(): string {
    return this.blocks.map(block => block.toCommand()).join('\n');
  }

  isEmpty(): boolean {
    return this.blocks.length === 0;
  }

  canExecute(): boolean {
    return !this.isEmpty();
  }
}
