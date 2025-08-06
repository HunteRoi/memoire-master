import { FC } from 'react';
import { useNavigate } from 'react-router';
import { Box, Card, CardActionArea, CardContent, Grid, Radio, Typography } from '@mui/material';

import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';
import { themeOptions } from '../types/Theme';
import { PageLayout } from '../components/layout/PageLayout';

export const ThemeSelection: FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useAppContext();
  
  useEnsureData();

  const handleContinue = () => navigate('/age-selection');
  
  const handleThemeSelection = (selectedTheme: typeof theme) => {
    setTheme(selectedTheme);
    try {
      localStorage.setItem('pucklab-theme', selectedTheme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  };

  return (
    <PageLayout
      title="Choose Your Theme"
      subtitle="Pick a style that makes you feel comfortable"
      onContinue={handleContinue}
      maxWidth="lg"
    >
      <Grid container spacing={3} sx={{ mt: 4, maxWidth: 1000 }}>
        {themeOptions.map((option) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={option.type}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: theme === option.type ? 3 : 1,
                borderColor: theme === option.type ? 'primary.main' : 'divider',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }}
            >
              <CardActionArea
                onClick={() => handleThemeSelection(option.type)}
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
                    checked={theme === option.type}
                    onChange={() => handleThemeSelection(option.type)}
                  />
                </Box>

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
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </PageLayout>
  );
};
