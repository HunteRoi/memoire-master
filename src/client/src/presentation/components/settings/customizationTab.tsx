import { Box, Card, CardContent, Typography } from '@mui/material';
import type { FC } from 'react';

import type { SettingsSection } from './types';

interface CustomizationTabProps {
  sections: SettingsSection[];
}

export const CustomizationTab: FC<CustomizationTabProps> = ({ sections }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: {
        xs: 3,
        sm: 4,
      },
      maxWidth: 800,
      mx: 'auto',
      pb: {
        xs: 3,
        sm: 4,
      },
    }}>
      {sections.map(section => (
        <Card 
          key={section.title} 
          elevation={1}
          sx={{
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              elevation: 2,
              transform: 'translateY(-1px)',
            },
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 3,
                sm: 4,
              },
              '&:last-child': {
                pb: {
                  xs: 3,
                  sm: 4,
                },
              },
            }}
          >
            <Typography 
              variant='h6' 
              gutterBottom
              sx={{
                fontSize: {
                  xs: '1.2rem',
                  sm: '1.3rem',
                },
                fontWeight: 600,
                color: 'text.primary',
                mb: {
                  xs: 1.5,
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
                    xs: 2.5,
                    sm: 3,
                  },
                  fontSize: {
                    xs: '0.9rem',
                    sm: '0.95rem',
                  },
                  lineHeight: 1.5,
                }}
              >
                {section.description}
              </Typography>
            )}
            <Box sx={{ 
              '& > *': {
                width: '100%',
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
