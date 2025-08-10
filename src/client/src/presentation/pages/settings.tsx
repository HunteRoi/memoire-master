import { ArrowBack, SmartToy, Tune } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { LanguageSelector } from '../components/languageSelector';
import { TabPanel } from '../components/tabPanel';
import { AgeSelectionContent } from '../containers/ageSelectionContent';
import { ModeSelectionContent } from '../containers/modeSelectionContent';
import { RobotSelectionContent } from '../containers/robotSelectionContent';
import { ThemeSelectionContent } from '../containers/themeSelectionContent';

export const Settings: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
          backgroundColor: 'background.paper',
        }}
      >
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant='h5' component='h1' sx={{ flexGrow: 1 }}>
          {t('settings.title')}
        </Typography>
        <LanguageSelector />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            icon={<Tune />}
            label={t('settings.tabs.customization')}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<SmartToy />}
            label={t('settings.tabs.robots')}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('settings.sections.themeSelection.title')}
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                  {t('settings.sections.themeSelection.description')}
                </Typography>
                <ThemeSelectionContent />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('settings.sections.ageConfiguration.title')}
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                  {t('settings.sections.ageConfiguration.description')}
                </Typography>
                <AgeSelectionContent />
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('settings.sections.robotManagement.title')}
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                  {t('settings.sections.robotManagement.description')}
                </Typography>
                <RobotSelectionContent />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {t('settings.sections.robotMode.title')}
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                  {t('settings.sections.robotMode.description')}
                </Typography>
                <ModeSelectionContent />
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};
