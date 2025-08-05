export class Robot {
    constructor(
        public readonly ipAddress: string,
        public readonly port: number,
    ) { }

    get id(): string {
        const value = this.ipAddress.split('.');
        return value[value.length - 1];
    }

    get name(): string {
        return `Robot ${this.id}`;
    }

    isValid(): boolean {
        return this.ipAddress !== ''
            && this.port > 0 && this.port < 65536;
    }

    updatePort(port: number): Robot {
        return new Robot(this.ipAddress, port);
    }
}
