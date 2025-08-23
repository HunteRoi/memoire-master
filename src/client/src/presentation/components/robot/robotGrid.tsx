import { Grid } from '@mui/material';
import type React from 'react';
import type { Robot } from '../../../domain/robot';
import { AddRobotCard } from './addRobotCard';
import { RobotCard } from './card';

interface RobotCardLabels {
  connect: (robotName: string) => string;
  disconnect: (robotName: string) => string;
  edit: (robotName: string) => string;
  delete: (robotName: string) => string;
  connected: string;
  disconnected: string;
}

interface RobotGridProps {
  robots: Robot[];
  selectedRobotId: string | null | undefined;
  isRobotConnected: (robotId: string) => boolean;
  getRobotBattery: (robotId: string) => number;
  onRobotSelect: (robot: Robot) => void;
  onRobotConnect: (robot: Robot) => void;
  onRobotEdit: (robot: Robot) => void;
  onRobotDelete: (robotId: string) => void;
  onRobotDisconnect: (robot: Robot) => void;
  onAddRobot: () => void;
  robotCardLabels: RobotCardLabels;
  addRobotCardLabel: string;
}

export const RobotGrid: React.FC<RobotGridProps> = ({
  robots,
  selectedRobotId,
  isRobotConnected,
  getRobotBattery,
  onRobotSelect,
  onRobotConnect,
  onRobotEdit,
  onRobotDelete,
  onRobotDisconnect,
  onAddRobot,
  robotCardLabels,
  addRobotCardLabel,
}) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3, width: '100%' }}>
      {robots.map(robot => (
        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={robot.id}>
          <RobotCard
            robot={robot}
            onSelect={onRobotSelect}
            onConnect={onRobotConnect}
            onEdit={onRobotEdit}
            onDelete={onRobotDelete}
            onDisconnect={onRobotDisconnect}
            selected={selectedRobotId === robot.id}
            connected={isRobotConnected(robot.id)}
            batteryPercentage={getRobotBattery(robot.id)}
            labels={robotCardLabels}
          />
        </Grid>
      ))}

      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <AddRobotCard onAddRobot={onAddRobot} label={addRobotCardLabel} />
      </Grid>
    </Grid>
  );
};
