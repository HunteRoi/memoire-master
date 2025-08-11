import { SmartToy, Tune } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';
import type { FC } from 'react';

interface SettingsTabsProps {
  value: number;
  customizationLabel: string;
  robotsLabel: string;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export const SettingsTabs: FC<SettingsTabsProps> = ({
  value,
  customizationLabel,
  robotsLabel,
  onChange,
}) => {
  return (
    <Box sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      px: {
        xs: 1,
        sm: 2,
      },
    }}>
      <Tabs 
        value={value} 
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            fontSize: {
              xs: '0.8rem',
              sm: '0.875rem',
            },
            minHeight: {
              xs: 40,
              sm: 48,
            },
            px: {
              xs: 1,
              sm: 2,
            },
          },
        }}
      >
        <Tab
          icon={<Tune />}
          label={customizationLabel}
          iconPosition='start'
        />
        <Tab
          icon={<SmartToy />}
          label={robotsLabel}
          iconPosition='start'
        />
      </Tabs>
    </Box>
  );
};
