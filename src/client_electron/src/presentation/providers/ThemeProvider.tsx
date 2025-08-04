import React, { ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import { useAppContext } from '../context/AppContext';
import { Theme, ThemeType } from '../types/Theme';

interface ThemeProviderProps {
  children: ReactNode;
}

const createMuiTheme = (appTheme: Theme) => {
  return createTheme({
    palette: {
      mode: appTheme.type === ThemeType.DARK ? 'dark' : 'light',
      primary: {
        main: appTheme.primaryColor,
      },
      secondary: {
        main: appTheme.secondaryColor,
      },
      background: {
        default: appTheme.backgroundColor,
        paper: appTheme.backgroundColor,
      },
      text: {
        primary: appTheme.textColor,
      },
    },
    components: {
      MuiGrid: {
        defaultProps: {
          size: 12,
        },
      },
    },
  });
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { state } = useAppContext();
  const appTheme = Theme.fromType(state.theme);
  const muiTheme = createMuiTheme(appTheme);

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};
