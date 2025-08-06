import React, { PropsWithChildren, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Theme as MuiTheme } from '@mui/material';

import { Theme, ThemeType } from '../types/Theme';
import { useAppContext } from '../hooks/useAppContext';

const createMuiTheme = (appTheme: Theme) => {
  return createTheme({
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
      // Add custom colors to the palette
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
    },
  });
};

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { theme } = useAppContext();
  const toMuiTheme = () => createMuiTheme(Theme.fromType(theme));
  const [muiTheme, setMuiTheme] = useState<MuiTheme>(toMuiTheme());

  useEffect(() => {
    setMuiTheme(toMuiTheme());
  }, [theme]);

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};
