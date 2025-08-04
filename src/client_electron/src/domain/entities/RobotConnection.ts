export class RobotConnection {
  constructor(
    public readonly ipAddress: string,
    public readonly port: number,
  ) { }

  isValid(): boolean {
    return this.ipAddress.length > 0
      && this.port > 0 && this.port <= 65535;
  }
}
