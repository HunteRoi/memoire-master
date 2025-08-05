export enum ThemeType {
  CLASSIC = 'classic',
  DARK = 'dark',
  PINK = 'pink',
  ADVENTURE = 'adventure',
  LEGO = 'lego'
}

export class Theme {
  constructor(
    public readonly type: ThemeType,
    public readonly primaryColor: string,
    public readonly secondaryColor: string,
    public readonly backgroundColor: string,
    public readonly textColor: string
  ) { }

  static createClassic(): Theme {
    return new Theme(
      ThemeType.CLASSIC,
      '#1976d2',
      '#dc004e',
      '#ffffff',
      '#000000'
    );
  }

  static createDark(): Theme {
    return new Theme(
      ThemeType.DARK,
      '#90caf9',
      '#f48fb1',
      '#121212',
      '#ffffff'
    );
  }

  static createPink(): Theme {
    return new Theme(
      ThemeType.PINK,
      '#e91e63',
      '#f06292',
      '#fce4ec',
      '#880e4f'
    );
  }

  static createAdventure(): Theme {
    return new Theme(
      ThemeType.ADVENTURE,
      '#4caf50',
      '#ff9800',
      '#e8f5e8',
      '#2e7d32'
    );
  }

  static createLego(): Theme {
    return new Theme(
      ThemeType.LEGO,
      '#ffeb3b',
      '#f44336',
      '#fff3e0',
      '#e65100'
    );
  }

  static fromType(type: ThemeType): Theme {
    switch (type) {
      case ThemeType.CLASSIC:
        return Theme.createClassic();
      case ThemeType.DARK:
        return Theme.createDark();
      case ThemeType.PINK:
        return Theme.createPink();
      case ThemeType.ADVENTURE:
        return Theme.createAdventure();
      case ThemeType.LEGO:
        return Theme.createLego();
      default:
        return Theme.createClassic();
    }
  }
}
