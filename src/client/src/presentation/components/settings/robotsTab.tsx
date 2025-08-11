import { Box, Card, CardContent, Typography } from '@mui/material';
import type { FC } from 'react';

import type { SettingsSection } from './types';

interface RobotsTabProps {
  sections: SettingsSection[];
}

export const RobotsTab: FC<RobotsTabProps> = ({ sections }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: {
        xs: 2,
        sm: 3,
      },
      pb: {
        xs: 2,
        sm: 3,
      },
    }}>
      {sections.map(section => (
        <Card key={section.title} elevation={2}>
          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },
              '&:last-child': {
                pb: {
                  xs: 2,
                  sm: 3,
                },
              },
            }}
          >
            <Typography 
              variant='h6' 
              gutterBottom
              sx={{
                fontSize: {
                  xs: '1.1rem',
                  sm: '1.25rem',
                },
                mb: {
                  xs: 1,
                  sm: 2,
                },
              }}
            >
              {section.title}
            </Typography>
            {section.description && (
              <Typography 
                variant='body2' 
                color='text.secondary' 
                sx={{
                  mb: {
                    xs: 1.5,
                    sm: 2,
                  },
                  fontSize: {
                    xs: '0.8rem',
                    sm: '0.875rem',
                  },
                  lineHeight: 1.4,
                }}
              >
                {section.description}
              </Typography>
            )}
            <Box sx={{ 
              '& > *': {
                transform: {
                  xs: 'scale(0.9)',
                  sm: 'scale(1)',
                },
                transformOrigin: 'top left',
              },
            }}>
              {section.content}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
