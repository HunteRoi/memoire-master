import { Box, Card, CardContent, Typography } from '@mui/material';
import { type FC } from 'react';

import { type SettingsSection } from './types';

interface CustomizationTabProps {
  sections: SettingsSection[];
}

export const CustomizationTab: FC<CustomizationTabProps> = ({ sections }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {sections.map((section, index) => (
        <Card key={index}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              {section.title}
            </Typography>
            {section.description && (
              <Typography variant='body2' color='text.secondary' paragraph>
                {section.description}
              </Typography>
            )}
            {section.content}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};