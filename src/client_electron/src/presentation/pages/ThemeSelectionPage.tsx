import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Container,
  Button,
  Radio
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { ThemeType, Theme } from '../types/Theme';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

interface ThemeOption {
  type: ThemeType;
  name: string;
  description: string;
  theme: Theme;
}

const themeOptions: ThemeOption[] = [
  {
    type: ThemeType.CLASSIC,
    name: 'Classic',
    description: 'Clean and professional',
    theme: Theme.createClassic()
  },
  {
    type: ThemeType.DARK,
    name: 'Dark',
    description: 'Easy on the eyes',
    theme: Theme.createDark()
  },
  {
    type: ThemeType.PINK,
    name: 'Pink',
    description: 'Fun and colorful',
    theme: Theme.createPink()
  },
  {
    type: ThemeType.ADVENTURE,
    name: 'Adventure',
    description: 'Nature inspired',
    theme: Theme.createAdventure()
  },
  {
    type: ThemeType.LEGO,
    name: 'Lego',
    description: 'Bright and playful',
    theme: Theme.createLego()
  }
];

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
  });
};

export const ThemeSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setTheme } = useAppContext();
  const [currentDisplayTheme, setCurrentDisplayTheme] = useState<Theme>(Theme.fromType(state.theme));

  const handleThemeSelect = (themeType: ThemeType) => {
    setTheme(themeType);
    const newTheme = Theme.fromType(themeType);
    setCurrentDisplayTheme(newTheme);
  };

  const handleContinue = () => {
    navigate('/age-selection');
  };

  return (
    <ThemeProvider theme={createMuiTheme(currentDisplayTheme)}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          color: 'text.primary',
          minHeight: '100vh',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Container maxWidth="lg">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            minHeight="100vh"
            py={4}
          >
            <Typography variant="h1" component="h1" gutterBottom align="center">
              Choose Your Theme
            </Typography>

            <Typography variant="h3" component="p" gutterBottom align="center" color="text.secondary">
              Pick a style that makes you feel comfortable
            </Typography>

            <Grid container spacing={3} sx={{ mt: 4, maxWidth: 1000 }}>
              {themeOptions.map((option) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={option.type}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: state.theme === option.type ? 3 : 1,
                      borderColor: state.theme === option.type ? 'primary.main' : 'divider',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      }
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleThemeSelect(option.type)}
                      sx={{ height: '100%', position: 'relative' }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1
                        }}
                      >
                        <Radio
                          checked={state.theme === option.type}
                          onChange={() => handleThemeSelect(option.type)}
                          sx={{
                            color: option.theme.primaryColor,
                            '&.Mui-checked': {
                              color: option.theme.primaryColor,
                            },
                          }}
                        />
                      </Box>

                      <ThemeProvider theme={createMuiTheme(option.theme)}>
                        <Box
                          sx={{
                            backgroundColor: 'background.default',
                            color: 'text.primary',
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `linear-gradient(135deg, ${option.theme.primaryColor}20 0%, ${option.theme.secondaryColor}20 100%)`,
                            }
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              color: option.theme.primaryColor,
                              fontWeight: 'bold',
                              zIndex: 1,
                              position: 'relative'
                            }}
                          >
                            Aa
                          </Typography>
                        </Box>

                        <CardContent sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
                          <Typography variant="h3" component="h2" gutterBottom color="primary">
                            {option.name}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {option.description}
                          </Typography>
                        </CardContent>
                      </ThemeProvider>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box mt={6}>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                sx={{ minWidth: 200 }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};
