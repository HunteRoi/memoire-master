import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Palette,
  Person,
  SmartToy,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { ThemeSelectionPage } from './ThemeSelectionPage';
import { AgeSelectionPage } from './AgeSelectionPage';
import { RobotSelectionPage } from './RobotSelectionPage';
import { ModeSelectionPage } from './ModeSelectionPage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

export const SettingsPage: React.FC = () => {
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
              <ThemeSelectionPage />
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
              <AgeSelectionPage />
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
              <RobotSelectionPage />
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
              <ModeSelectionPage />
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
