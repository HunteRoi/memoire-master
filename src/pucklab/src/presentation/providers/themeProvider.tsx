import React, { PropsWithChildren, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Theme as MuiTheme } from '@mui/material';

import { Theme, ThemeType } from '../types/Theme';
import { useAppContext } from '../hooks/useAppContext';

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
