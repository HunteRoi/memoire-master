export enum AgeGroup {
  SIMPLE = 'simple',    // 1-12 years
  ADVANCED = 'advanced' // 13-99 years
}

export class Age {
  constructor(public readonly value: number) { }

  getGroup(): AgeGroup {
    return this.value <= 12 ? AgeGroup.SIMPLE : AgeGroup.ADVANCED;
  }

  isSimpleMode(): boolean {
    return this.getGroup() === AgeGroup.SIMPLE;
  }

  isAdvancedMode(): boolean {
    return this.getGroup() === AgeGroup.ADVANCED;
  }
}
