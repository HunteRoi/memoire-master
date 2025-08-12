import { Box } from '@mui/material';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { CustomizationTab } from '../components/settings/customizationTab';
import { RobotsTab } from '../components/settings/robotsTab';
import { SettingsHeader } from '../components/settings/settingsHeader';
import { SettingsTabs } from '../components/settings/settingsTabs';
import { TabPanel } from '../components/tabPanel';
import { AgeSelectionContent } from '../containers/ageSelectionContent';
import { ClearCacheContent } from '../containers/clearCacheContent';
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

  const customizationSections = [
    {
      title: t('settings.sections.themeSelection.title'),
      description: t('settings.sections.themeSelection.description'),
      content: <ThemeSelectionContent />,
    },
    {
      title: t('settings.sections.ageConfiguration.title'),
      description: t('settings.sections.ageConfiguration.description'),
      content: <AgeSelectionContent />,
    },
    {
      title: t('settings.sections.clearCache.title', 'Clear Cache'),
      description: t(
        'settings.section.clearCache.description',
        'Clear all stored data including your workspace, console history, and preferences. This action cannot be undone.'
      ),
      content: <ClearCacheContent />,
    },
  ];

  const robotsSections = [
    {
      title: t('settings.sections.robotManagement.title'),
      description: t('settings.sections.robotManagement.description'),
      content: <RobotSelectionContent />,
    },
    {
      title: t('settings.sections.robotMode.title'),
      description: t('settings.sections.robotMode.description'),
      content: <ModeSelectionContent />,
    },
  ];

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: 'background.default',
    }}>
      <SettingsHeader title={t('settings.title')} onBack={handleBack} />

      <SettingsTabs
        value={tabValue}
        customizationLabel={t('settings.tabs.customization')}
        robotsLabel={t('settings.tabs.robots')}
        onChange={handleTabChange}
      />

      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        backgroundColor: 'background.default',
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}>
        <TabPanel value={tabValue} index={0}>
          <CustomizationTab sections={customizationSections} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <RobotsTab sections={robotsSections} />
        </TabPanel>
      </Box>
    </Box>
  );
};
