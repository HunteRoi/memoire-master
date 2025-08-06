import { FC, MouseEventHandler } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

import { Robot } from '../../../domain/robot';
import { DEFAULT_ROBOT } from '../../../domain/constants';

interface RobotCardProps {
  robot: Robot;
  onSelect: (robot: Robot) => void;
  onEdit: (robot: Robot) => void;
  onDelete: (robotId: string) => void;
  selected: boolean;
}

export const RobotCard: FC<RobotCardProps> = ({
  robot,
  onSelect,
  onEdit,
  onDelete,
  selected
}) => {
  const onEditClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onEdit(robot);
  };
  const onDeleteClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onDelete(robot.id);
  }

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
