export enum AgeGroup {
  SIMPLE = 'simple',    // 6-12 years
  ADVANCED = 'advanced' // 13-18 years
}

export class Age {
  constructor(public readonly value: number) {}

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