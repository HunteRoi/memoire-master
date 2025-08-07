import React from 'react';
import { Grid } from '@mui/material';
import { Robot } from '../../../domain/robot';
import { RobotCard } from './card';
import { AddRobotCard } from './addRobotCard';

interface RobotGridProps {
  robots: Robot[];
  selectedRobotId: string | null | undefined;
  isRobotConnected: (robotId: string) => boolean;
  onRobotSelect: (robot: Robot) => void;
  onRobotEdit: (robot: Robot) => void;
  onRobotDelete: (robotId: string) => void;
  onRobotDisconnect: (robot: Robot) => void;
  onAddRobot: () => void;
}

export const RobotGrid: React.FC<RobotGridProps> = ({
  robots,
  selectedRobotId,
  isRobotConnected,
  onRobotSelect,
  onRobotEdit,
  onRobotDelete,
  onRobotDisconnect,
  onAddRobot,
}) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3, width: '100%' }}>
      {robots.map(robot => (
        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={robot.id}>
          <RobotCard
            robot={robot}
            onSelect={onRobotSelect}
            onEdit={onRobotEdit}
            onDelete={onRobotDelete}
            onDisconnect={onRobotDisconnect}
            selected={selectedRobotId === robot.id}
            connected={isRobotConnected(robot.id)}
          />
        </Grid>
      ))}

      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <AddRobotCard onAddRobot={onAddRobot} />
      </Grid>
    </Grid>
  );
};
