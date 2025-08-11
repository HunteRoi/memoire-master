import { Delete, Edit, LinkOff, Wifi, WifiOff, Link } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { type FC, type MouseEventHandler, memo, useCallback, useMemo } from 'react';

import { DEFAULT_ROBOT } from '../../../domain/constants';
import type { Robot } from '../../../domain/robot';
import { useRobotTranslations } from '../../hooks/useRobotTranslations';

interface RobotCardLabels {
  connect: (robotName: string) => string;
  disconnect: (robotName: string) => string;
  edit: (robotName: string) => string;
  delete: (robotName: string) => string;
  connected: string;
  disconnected: string;
}

interface RobotCardProps {
  robot: Robot;
  onSelect: (robot: Robot) => void;
  onConnect: (robot: Robot) => void;
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
  onConnect,
  onEdit,
  onDelete,
  onDisconnect,
  selected,
  connected,
  labels,
}) => {
  const { getRobotDisplayName } = useRobotTranslations();
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

  const onConnectClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    event => {
      event.stopPropagation();
      onConnect(robot);
    },
    [onConnect, robot]
  );

  const isDefaultRobot = useMemo(
    () => robot.id === DEFAULT_ROBOT.id,
    [robot.id]
  );

  const cardSx = useMemo(
    () => ({
      height: '100%',
      minHeight: 200,
      border: selected ? 2 : 1,
      borderColor: selected ? 'primary.main' : 'divider',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      '&:hover': {
        borderColor: 'primary.main',
        elevation: 4,
      },
    }),
    [selected]
  );

  const handleCardClick = useCallback(() => {
    onSelect(robot);
  }, [onSelect, robot]);


  const robotDisplayName = useMemo(
    () => getRobotDisplayName(robot),
    [getRobotDisplayName, robot]
  );

  const editAriaLabel = useMemo(
    () => labels.edit(robotDisplayName),
    [labels, robotDisplayName]
  );

  const deleteAriaLabel = useMemo(
    () => labels.delete(robotDisplayName),
    [labels, robotDisplayName]
  );

  const connectTooltip = useMemo(
    () => labels.connect(robotDisplayName),
    [labels, robotDisplayName]
  );

  const disconnectTooltip = useMemo(
    () => labels.disconnect(robotDisplayName),
    [labels, robotDisplayName]
  );

  return (
    <Card sx={cardSx} onClick={handleCardClick}>
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
            <Typography variant='h6'>{robotDisplayName}</Typography>
            <Chip
              icon={connected ? <Wifi /> : <WifiOff />}
              label={connected ? labels.connected : labels.disconnected}
              color={connected ? 'success' : 'default'}
              size='small'
            />
          </Box>
          <Box>
            {connected ? (
              <Tooltip title={disconnectTooltip}>
                <IconButton
                  size='small'
                  onClick={onDisconnectClick}
                  color='warning'
                  aria-label={disconnectTooltip}
                >
                  <LinkOff />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={connectTooltip}>
                <IconButton
                  size='small'
                  onClick={onConnectClick}
                  color='primary'
                  aria-label={connectTooltip}
                >
                  <Link />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={editAriaLabel}>
              <IconButton
                size='small'
                onClick={onEditClick}
                aria-label={editAriaLabel}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            {!isDefaultRobot && (
              <Tooltip title={deleteAriaLabel}>
                <IconButton
                  size='small'
                  onClick={onDeleteClick}
                  aria-label={deleteAriaLabel}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
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
    prevProps.selected === nextProps.selected &&
    prevProps.connected === nextProps.connected &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onConnect === nextProps.onConnect &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onDisconnect === nextProps.onDisconnect &&
    prevProps.labels === nextProps.labels
  );
});
