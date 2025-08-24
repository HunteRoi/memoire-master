import {
  Battery0Bar,
  Battery1Bar,
  Battery2Bar,
  Battery3Bar,
  Battery4Bar,
  Battery5Bar,
  Battery6Bar,
  BatteryFull,
  BatteryUnknown,
  Delete,
  Edit,
  Link,
  LinkOff,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  type FC,
  type MouseEventHandler,
  memo,
  useCallback,
  useMemo,
} from 'react';

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
  batteryPercentage?: number;
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
  batteryPercentage = 0,
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
      minWidth: 320, // Ensure minimum width for button layout
      maxWidth: 400, // Prevent cards from becoming too wide
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

  const getBatteryIcon = (percentage: number) => {
    if (percentage >= 90) return <BatteryFull />;
    if (percentage >= 75) return <Battery6Bar />;
    if (percentage >= 60) return <Battery5Bar />;
    if (percentage >= 45) return <Battery4Bar />;
    if (percentage >= 30) return <Battery3Bar />;
    if (percentage >= 15) return <Battery2Bar />;
    if (percentage > 0) return <Battery1Bar />;
    if (percentage === 0) return <Battery0Bar />;
    return <BatteryUnknown />;
  };

  const getBatteryColor = (percentage: number): 'success' | 'warning' | 'error' | 'default' => {
    if (percentage >= 50) return 'success';
    if (percentage >= 20) return 'warning';
    if (percentage > 0) return 'error';
    return 'default';
  };

  return (
    <Card sx={cardSx} onClick={handleCardClick}>
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2,
          '&:last-child': {
            pb: 2,
          },
        }}
      >
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='flex-start'
          mb={2}
          sx={{
            minHeight: 40, // Ensure consistent height for button area
          }}
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
          <Box 
            display='flex' 
            alignItems='center' 
            gap={0.5}
            sx={{
              flexShrink: 0, // Prevent buttons from shrinking
              minWidth: 'fit-content', // Ensure buttons always have space
            }}
          >
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

        <Box>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            IP: {robot.ipAddress}:{robot.port}
          </Typography>
          {connected && batteryPercentage > 0 && (
            <Box display='flex' alignItems='center' gap={1} mt={1}>
              <Chip
                icon={getBatteryIcon(batteryPercentage)}
                label={`${batteryPercentage}%`}
                color={getBatteryColor(batteryPercentage)}
                size='small'
                variant='outlined'
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export const RobotCard = memo(RobotCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.robot.id === nextProps.robot.id &&
    prevProps.robot.ipAddress === nextProps.robot.ipAddress &&
    prevProps.robot.port === nextProps.robot.port &&
    prevProps.selected === nextProps.selected &&
    prevProps.connected === nextProps.connected &&
    prevProps.batteryPercentage === nextProps.batteryPercentage &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onConnect === nextProps.onConnect &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onDisconnect === nextProps.onDisconnect &&
    prevProps.labels === nextProps.labels
  );
});
