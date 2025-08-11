import { Box, Card, CardContent } from '@mui/material';
import type React from 'react';

interface AgeCardProps {
  children: React.ReactNode;
}

export const AgeCard: React.FC<AgeCardProps> = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: {
          xs: '140px',
          sm: '180px',
          md: '200px',
        },
        mt: {
          xs: 1,
          sm: 2,
        },
      }}
    >
      <Card sx={{ 
        width: '100%', 
        maxWidth: {
          xs: 400,
          sm: 500,
        },
        minHeight: {
          xs: 120,
          sm: 160,
          md: 180,
        },
      }}>
        <CardContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: {
              xs: 2,
              sm: 3,
              md: 4,
            },
          }}
        >
          {children}
        </CardContent>
      </Card>
    </Box>
  );
};
