export enum ThemeType {
  CLASSIC = 'classic',
  DARK = 'dark',
  PINK = 'pink',
  ADVENTURE = 'adventure',
  LEGO = 'lego',
}

export type ThemeOption = {
  type: ThemeType;
  name: string;
  description: string;
  theme: Theme;
};

export interface ThemeColors {
  primary: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export class Theme {
  constructor(
    public readonly type: ThemeType,
    public readonly colors: ThemeColors
  ) {}

  static createClassic(): Theme {
    return new Theme(ThemeType.CLASSIC, {
      primary: {
        main: '#1565c0',
        light: '#5e92f3',
        dark: '#003c8f',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f8faff',
        paper: '#ffffff',
        elevated: '#f5f5f5',
      },
      surface: {
        primary: '#e3f2fd',
        secondary: '#fff1f3',
        tertiary: '#f0f4f8',
      },
      text: {
        primary: '#1a1a1a',
        secondary: '#666666',
        disabled: '#999999',
      },
      accent: '#ff6b35',
      success: '#2e7d32',
      warning: '#f57c00',
      error: '#d32f2f',
    });
  }

  static createDark(): Theme {
    return new Theme(ThemeType.DARK, {
      primary: {
        main: '#64b5f6',
        light: '#9be7ff',
        dark: '#2286c3',
        contrastText: '#000000',
      },
      secondary: {
        main: '#f48fb1',
        light: '#ffc1e3',
        dark: '#bf5f82',
        contrastText: '#000000',
      },
      background: {
        default: '#0a0e13',
        paper: '#1a1f26',
        elevated: '#242933',
      },
      surface: {
        primary: '#1e2328',
        secondary: '#2a1f26',
        tertiary: '#1f252b',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b3b3b3',
        disabled: '#666666',
      },
      accent: '#ff7043',
      success: '#4caf50',
      warning: '#ffb74d',
      error: '#f44336',
    });
  }

  static createPink(): Theme {
    return new Theme(ThemeType.PINK, {
      primary: {
        main: '#d81b60',
        light: '#ff5983',
        dark: '#a00037',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#7b1fa2',
        light: '#ae52d4',
        dark: '#4a0072',
        contrastText: '#ffffff',
      },
      background: {
        default: '#fdf2f8',
        paper: '#ffffff',
        elevated: '#f8e7f0',
      },
      surface: {
        primary: '#fce4ec',
        secondary: '#f3e5f5',
        tertiary: '#fad2e1',
      },
      text: {
        primary: '#1a1a1a',
        secondary: '#666666',
        disabled: '#999999',
      },
      accent: '#ff6b6b',
      success: '#388e3c',
      warning: '#f57c00',
      error: '#d32f2f',
    });
  }

  static createAdventure(): Theme {
    return new Theme(ThemeType.ADVENTURE, {
      primary: {
        main: '#2e7d32',
        light: '#60ad5e',
        dark: '#005005',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#ef6c00',
        light: '#ff9d3f',
        dark: '#b53d00',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f1f8e9',
        paper: '#ffffff',
        elevated: '#e8f5e8',
      },
      surface: {
        primary: '#c8e6c9',
        secondary: '#ffe0b2',
        tertiary: '#dcedc8',
      },
      text: {
        primary: '#1b5e20',
        secondary: '#388e3c',
        disabled: '#81c784',
      },
      accent: '#ff7043',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#d32f2f',
    });
  }

  static createLego(): Theme {
    return new Theme(ThemeType.LEGO, {
      primary: {
        main: '#1976d2',
        light: '#63a4ff',
        dark: '#004ba0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#f44336',
        light: '#ff7961',
        dark: '#ba000d',
        contrastText: '#ffffff',
      },
      background: {
        default: '#fff8e1',
        paper: '#ffffff',
        elevated: '#ffeaa7',
      },
      surface: {
        primary: '#ffecb3',
        secondary: '#ffcdd2',
        tertiary: '#e1f5fe',
      },
      text: {
        primary: '#263238',
        secondary: '#455a64',
        disabled: '#90a4ae',
      },
      accent: '#4caf50',
      success: '#388e3c',
      warning: '#f57c00',
      error: '#d32f2f',
    });
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

export const themeOptions: ThemeOption[] = [
  {
    type: ThemeType.CLASSIC,
    name: 'Classic',
    description: 'Clean and professional',
    theme: Theme.createClassic(),
  },
  {
    type: ThemeType.DARK,
    name: 'Dark',
    description: 'Easy on the eyes',
    theme: Theme.createDark(),
  },
  {
    type: ThemeType.PINK,
    name: 'Pink',
    description: 'Fun and colorful',
    theme: Theme.createPink(),
  },
  {
    type: ThemeType.ADVENTURE,
    name: 'Adventure',
    description: 'Nature inspired',
    theme: Theme.createAdventure(),
  },
  {
    type: ThemeType.LEGO,
    name: 'Lego',
    description: 'Bright and playful',
    theme: Theme.createLego(),
  },
];
