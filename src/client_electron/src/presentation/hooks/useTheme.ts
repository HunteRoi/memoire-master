import { createTheme } from '@mui/material/styles';
import { useMemo } from 'react';

import { Theme, ThemeType } from '../types/Theme';
import { AgeGroup } from '../types/Age';

export const useAppTheme = (theme: Theme, ageGroup: AgeGroup) => {
  return useMemo(() => {
    const isSimple = ageGroup === AgeGroup.SIMPLE;

    return createTheme({
      palette: {
        mode: theme.type === ThemeType.DARK ? 'dark' : 'light',
        primary: {
          main: theme.primaryColor,
        },
        secondary: {
          main: theme.secondaryColor,
        },
        background: {
          default: theme.backgroundColor,
          paper: theme.backgroundColor,
        },
        text: {
          primary: theme.textColor,
        },
      },
      typography: {
        fontSize: isSimple ? 18 : 14,
        h1: {
          fontSize: isSimple ? '3rem' : '2.5rem',
          fontWeight: 600,
        },
        h2: {
          fontSize: isSimple ? '2.5rem' : '2rem',
          fontWeight: 600,
        },
        h3: {
          fontSize: isSimple ? '2rem' : '1.5rem',
          fontWeight: 500,
        },
        button: {
          fontSize: isSimple ? '1.2rem' : '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: isSimple ? 12 : 8,
              padding: isSimple ? '12px 24px' : '8px 16px',
              minHeight: isSimple ? 56 : 36,
              fontSize: isSimple ? '1.2rem' : '0.875rem',
            },
            containedPrimary: {
              backgroundColor: theme.primaryColor,
              '&:hover': {
                backgroundColor: theme.primaryColor,
                filter: 'brightness(0.9)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: isSimple ? 16 : 8,
              padding: isSimple ? '24px' : '16px',
              boxShadow: isSimple
                ? '0 4px 12px rgba(0,0,0,0.15)'
                : '0 2px 8px rgba(0,0,0,0.1)',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiInputBase-root': {
                fontSize: isSimple ? '1.2rem' : '1rem',
                minHeight: isSimple ? 56 : 40,
              },
              '& .MuiInputLabel-root': {
                fontSize: isSimple ? '1.2rem' : '1rem',
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              width: isSimple ? 56 : 40,
              height: isSimple ? 56 : 40,
              '& .MuiSvgIcon-root': {
                fontSize: isSimple ? '2rem' : '1.5rem',
              },
            },
          },
        },
      },
    });
  }, [theme, ageGroup]);
};
