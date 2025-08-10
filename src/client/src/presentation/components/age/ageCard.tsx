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
        minHeight: '200px',
        mt: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 500, minHeight: 180 }}>
        <CardContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
          }}
        >
          {children}
        </CardContent>
      </Card>
    </Box>
  );
};