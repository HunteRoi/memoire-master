import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Delete, Edit, Wifi, WifiOff } from '@mui/icons-material';

import { Robot } from '../../domain/entities/Robot';

interface RobotCardProps {
  robot: Robot;
  onSelect: (robot: Robot) => void;
  onEdit: (robot: Robot) => void;
  onDelete: (robotId: string) => void;
  selected: boolean;
}

export const RobotCard: React.FC<RobotCardProps> = ({
  robot,
  onSelect,
  onEdit,
  onDelete,
  selected
}) => {
  return (
    <Card
      sx={{
        cursor: 'pointer',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        position: 'relative',
        '&:hover': {
          borderColor: 'primary.main',
          elevation: 4
        }
      }}
      onClick={() => onSelect(robot)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6">
            Robot {robot.id}
          </Typography>
          <Box>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(robot); }}>
              <Edit />
            </IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(robot.id); }}>
              <Delete />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          IP: {robot.ip}:{robot.port}
        </Typography>

        <Box display="flex" alignItems="center" mt={1}>
          {robot.isConnected ? (
            <>
              <Wifi color="success" fontSize="small" />
              <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                Connected
              </Typography>
            </>
          ) : (
            <>
              <WifiOff color="error" fontSize="small" />
              <Typography variant="body2" color="error.main" sx={{ ml: 0.5 }}>
                Disconnected
              </Typography>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
