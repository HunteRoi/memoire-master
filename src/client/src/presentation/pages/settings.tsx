import { FC, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Card, CardContent, Grid, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { ArrowBack, Palette, Person, SmartToy, Settings as SettingsIcon } from '@mui/icons-material';

import { TabPanel } from '../components/tabPanel';
import { ThemeSelectionContent } from '../containers/themeSelectionContent';
import { AgeSelectionContent } from '../containers/ageSelectionContent';
import { RobotSelectionContent } from '../containers/robotSelectionContent';
import { ModeSelectionContent } from '../containers/modeSelectionContent';

export const Settings: FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/programming');
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
          Settings
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            icon={<Palette />}
            label="Theme"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<Person />}
            label="Age"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<SmartToy />}
            label="Robots"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<SettingsIcon />}
            label="Mode"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Theme Selection
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose your preferred color theme for the application.
              </Typography>
              <ThemeSelectionContent />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Age Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Set your age to customize the interface complexity.
              </Typography>
              <AgeSelectionContent />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Robot Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your robot connections and add new robots.
              </Typography>
              <RobotSelectionContent />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Robot Mode
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose the operating mode for your robot.
              </Typography>
              <ModeSelectionContent />
            </CardContent>
          </Card>
        </TabPanel>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/programming')}
            >
              Cancel
            </Button>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/programming')}
            >
              Save & Return
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
