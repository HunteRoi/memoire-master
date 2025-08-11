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
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} onChange={onChange}>
        <Tab
          icon={<Tune />}
          label={customizationLabel}
          iconPosition='start'
          sx={{ minHeight: 48 }}
        />
        <Tab
          icon={<SmartToy />}
          label={robotsLabel}
          iconPosition='start'
          sx={{ minHeight: 48 }}
        />
      </Tabs>
    </Box>
  );
};
