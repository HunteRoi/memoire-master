import React from 'react';
import { Card, CardContent, Fab, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';

interface AddRobotCardProps {
  onAddRobot: () => void;
}

export const AddRobotCard: React.FC<AddRobotCardProps> = ({ onAddRobot }) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: '2px dashed',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'action.hover'
        }
      }}
      onClick={onAddRobot}
    >
      <CardContent sx={{ textAlign: 'center' }}>
        <Fab size="medium" color="primary" sx={{ mb: 2 }}>
          <Add />
        </Fab>
        <Typography variant="h6">
          Add New Robot
        </Typography>
      </CardContent>
    </Card>
  );
};