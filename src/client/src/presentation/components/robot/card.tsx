import { Delete, Edit, LinkOff, Wifi, WifiOff } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import type { FC, MouseEventHandler } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { DEFAULT_ROBOT } from '../../../domain/constants';
import type { Robot } from '../../../domain/robot';

interface RobotCardLabels {
  select: (robotName: string) => string;
  edit: (robotName: string) => string;
  delete: (robotName: string) => string;
  disconnect: (robotName: string) => string;
  connected: string;
  disconnected: string;
}

interface RobotCardProps {
  robot: Robot;
  onSelect: (robot: Robot) => void;
  onEdit: (robot: Robot) => void;
  onDelete: (robotId: string) => void;
  onDisconnect: (robot: Robot) => void;
  selected: boolean;
  connected: boolean;
  labels: RobotCardLabels;
}

const RobotCardComponent: FC<RobotCardProps> = ({
  robot,
  onSelect,
  onEdit,
  onDelete,
  onDisconnect,
  selected,
  connected,
  labels,
}) => {
  // Memoize event handlers to prevent unnecessary re-renders
  const onEditClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    event => {
      event.stopPropagation();
      onEdit(robot);
    },
    [onEdit, robot]
  );

  const onDeleteClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    event => {
      event.stopPropagation();
      onDelete(robot.id);
    },
    [onDelete, robot.id]
  );

  const onDisconnectClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    event => {
      event.stopPropagation();
      onDisconnect(robot);
    },
    [onDisconnect, robot]
  );

  const handleCardClick = useCallback(() => {
    onSelect(robot);
  }, [onSelect, robot]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(robot);
      }
    },
    [onSelect, robot]
  );

  // Memoize computed values
  const isDefaultRobot = useMemo(
    () => robot.id === DEFAULT_ROBOT.id,
    [robot.id]
  );

  const cardSx = useMemo(
    () => ({
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
        elevation: 4,
      },
      '&:focus': {
        outline: '2px solid',
        outlineColor: 'primary.main',
        outlineOffset: '2px',
      },
    }),
    [selected]
  );

  const selectAriaLabel = useMemo(
    () => labels.select(robot.name),
    [labels, robot.name]
  );

  const editAriaLabel = useMemo(
    () => labels.edit(robot.name),
    [labels, robot.name]
  );

  const deleteAriaLabel = useMemo(
    () => labels.delete(robot.name),
    [labels, robot.name]
  );

  const disconnectAriaLabel = useMemo(
    () => labels.disconnect(robot.name),
    [labels, robot.name]
  );

  return (
    <Card
      tabIndex={0}
      aria-pressed={selected}
      aria-label={selectAriaLabel}
      sx={cardSx}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='flex-start'
          mb={2}
        >
          <Box display='flex' alignItems='center' gap={1}>
            <Typography variant='h6'>Robot {robot.id}</Typography>
            <Chip
              icon={connected ? <Wifi /> : <WifiOff />}
              label={connected ? labels.connected : labels.disconnected}
              color={connected ? 'success' : 'default'}
              size='small'
            />
          </Box>
          <Box>
            {connected && (
              <IconButton
                size='small'
                onClick={onDisconnectClick}
                color='warning'
                aria-label={disconnectAriaLabel}
              >
                <LinkOff />
              </IconButton>
            )}
            <IconButton
              size='small'
              onClick={onEditClick}
              aria-label={editAriaLabel}
            >
              <Edit />
            </IconButton>
            {!isDefaultRobot && (
              <IconButton
                size='small'
                onClick={onDeleteClick}
                aria-label={deleteAriaLabel}
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography variant='body2' color='text.secondary' gutterBottom>
          IP: {robot.ipAddress}:{robot.port}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Memoize the component with custom comparison function for better performance
export const RobotCard = memo(RobotCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.robot.id === nextProps.robot.id &&
    prevProps.robot.ipAddress === nextProps.robot.ipAddress &&
    prevProps.robot.port === nextProps.robot.port &&
    prevProps.robot.name === nextProps.robot.name &&
    prevProps.selected === nextProps.selected &&
    prevProps.connected === nextProps.connected &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onDisconnect === nextProps.onDisconnect &&
    prevProps.labels === nextProps.labels
  );
});
