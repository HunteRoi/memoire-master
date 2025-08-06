import { FC, MouseEventHandler } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import { Delete, Edit, Wifi, WifiOff, LinkOff } from '@mui/icons-material';

import { Robot } from '../../../domain/robot';
import { DEFAULT_ROBOT } from '../../../domain/constants';

interface RobotCardProps {
  robot: Robot;
  onSelect: (robot: Robot) => void;
  onEdit: (robot: Robot) => void;
  onDelete: (robotId: string) => void;
  onDisconnect?: (robot: Robot) => void;
  selected: boolean;
  connected: boolean;
}

export const RobotCard: FC<RobotCardProps> = ({
  robot,
  onSelect,
  onEdit,
  onDelete,
  onDisconnect,
  selected,
  connected
}) => {
  const onEditClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onEdit(robot);
  };
  const onDeleteClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onDelete(robot.id);
  };

  const onDisconnectClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onDisconnect?.(robot);
  };

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 140,
        cursor: 'pointer',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          borderColor: 'primary.main',
          elevation: 4
        }
      }}
      onClick={() => onSelect(robot)}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">
              Robot {robot.id}
            </Typography>
            <Chip
              icon={connected ? <Wifi /> : <WifiOff />}
              label={connected ? 'Connected' : 'Disconnected'}
              color={connected ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <Box>
            {connected && onDisconnect && (
              <IconButton size="small" onClick={onDisconnectClick} color="warning">
                <LinkOff />
              </IconButton>
            )}
            <IconButton size="small" onClick={onEditClick}>
              <Edit />
            </IconButton>
            {robot.id !== DEFAULT_ROBOT.id && (
              <IconButton size="small" onClick={onDeleteClick}>
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          IP: {robot.ipAddress}:{robot.port}
        </Typography>
      </CardContent>
    </Card>
  );
};
