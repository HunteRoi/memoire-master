import { CssBaseline, type Theme as MuiTheme } from '@mui/material';
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from '@mui/material/styles';
import type React from 'react';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Theme, ThemeType } from '../models/Theme';

// Import fonts for each theme
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/fira-code/400.css';
import '@fontsource/fira-code/500.css';
import '@fontsource/fira-code/600.css';
import '@fontsource/source-code-pro/400.css';
import '@fontsource/source-code-pro/500.css';
import '@fontsource/source-code-pro/600.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/dancing-script/400.css';
import '@fontsource/dancing-script/500.css';
import '@fontsource/dancing-script/600.css';
import '@fontsource/dancing-script/700.css';
import '@fontsource/pacifico/400.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/700.css';
import '@fontsource/crimson-text/400.css';
import '@fontsource/crimson-text/600.css';
import '@fontsource/cabin/400.css';
import '@fontsource/cabin/500.css';
import '@fontsource/cabin/600.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/ubuntu-mono/400.css';
import '@fontsource/ubuntu-mono/700.css';
import '@fontsource/comic-neue/400.css';
import '@fontsource/comic-neue/700.css';
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/baloo-2/400.css';
import '@fontsource/baloo-2/500.css';
import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/500.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';

const createMuiTheme = (appTheme: Theme) => {
  return createTheme({
    typography: {
      fontFamily: appTheme.fonts.primary,
      h1: {
        fontFamily: appTheme.fonts.primary,
        fontWeight: 700,
      },
      h2: {
        fontFamily: appTheme.fonts.primary,
        fontWeight: 700,
      },
      h3: {
        fontFamily: appTheme.fonts.primary,
        fontWeight: 600,
      },
      h4: {
        fontFamily: appTheme.fonts.primary,
        fontWeight: 600,
      },
      h5: {
        fontFamily: appTheme.fonts.primary,
        fontWeight: 600,
      },
      h6: {
        fontFamily: appTheme.fonts.primary,
        fontWeight: 600,
      },
      subtitle1: {
        fontFamily: appTheme.fonts.secondary,
        fontWeight: 500,
      },
      subtitle2: {
        fontFamily: appTheme.fonts.secondary,
        fontWeight: 500,
      },
      body1: {
        fontFamily: appTheme.fonts.primary,
      },
      body2: {
        fontFamily: appTheme.fonts.primary,
      },
      button: {
        fontFamily: appTheme.fonts.primary,
        fontWeight: 600,
        textTransform: 'none',
      },
      caption: {
        fontFamily: appTheme.fonts.secondary,
      },
      overline: {
        fontFamily: appTheme.fonts.secondary,
      },
    },
    palette: {
      mode: appTheme.type === ThemeType.DARK ? 'dark' : 'light',
      primary: appTheme.colors.primary,
      secondary: appTheme.colors.secondary,
      background: {
        default: appTheme.colors.background.default,
        paper: appTheme.colors.background.paper,
      },
      text: {
        primary: appTheme.colors.text.primary,
        secondary: appTheme.colors.text.secondary,
        disabled: appTheme.colors.text.disabled,
      },
      success: {
        main: appTheme.colors.success,
      },
      warning: {
        main: appTheme.colors.warning,
      },
      error: {
        main: appTheme.colors.error,
      },
      action: {
        hover: appTheme.colors.surface.primary,
      },
    },
    components: {
      MuiGrid: {
        defaultProps: {
          size: 12,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '12px 24px',
          },
          contained: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            backgroundColor: appTheme.colors.background.paper,
          },
          elevation2: {
            backgroundColor: appTheme.colors.surface.primary,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: appTheme.colors.background.paper,
            borderBottom: `1px solid ${appTheme.colors.surface.primary}`,
          },
          indicator: {
            backgroundColor: appTheme.colors.primary.main,
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: appTheme.colors.text.secondary,
            minHeight: 48,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: appTheme.colors.surface.primary,
              color: appTheme.colors.text.primary,
            },
            '&.Mui-selected': {
              color: appTheme.colors.primary.main,
              fontWeight: 600,
            },
            '&.Mui-focusVisible': {
              backgroundColor: appTheme.colors.surface.primary,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: appTheme.colors.background.paper,
            color: appTheme.colors.text.primary,
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)`,
            borderBottom: `1px solid ${appTheme.colors.surface.primary}`,
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            backgroundColor: appTheme.colors.background.paper,
            color: appTheme.colors.text.primary,
            padding: '0 16px',
            minHeight: '56px !important',
            '& .MuiIconButton-root': {
              color: appTheme.colors.text.secondary,
              '&:hover': {
                backgroundColor: appTheme.colors.surface.primary,
                color: appTheme.colors.text.primary,
              },
            },
            '& .MuiTypography-root': {
              color: appTheme.colors.text.primary,
            },
          },
        },
      },
    },
  });
};

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { theme } = useAppContext();
  const toMuiTheme = useCallback(
    (type: ThemeType) => createMuiTheme(Theme.fromType(type)),
    []
  );
  const [muiTheme, setMuiTheme] = useState<MuiTheme>(toMuiTheme(theme));

  useEffect(() => {
    setMuiTheme(toMuiTheme(theme));
  }, [toMuiTheme, theme]);

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};
