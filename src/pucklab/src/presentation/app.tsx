import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Button, List, ListItem, Typography } from '@mui/material';

import { Robot, type RobotConfig } from '../domain/robot';
import { isSuccess, Result } from '../domain/result';

const App: React.FC = () => {
  const [robots, setRobots] = React.useState<Robot[]>([]);
  const [error, setError] = React.useState<string>('');

  const updateRobotsList = (result: Result<RobotConfig[]>) => {
    if (isSuccess(result)) {
      const robotsData = result.data.map(robotData =>
        new Robot(robotData.ipAddress, robotData.port)
      );
      setRobots(robotsData);
      setError('');
    } else {
      setError(result.error);
      console.error('Error updating robots list:', result.error);
    }
  };

  const onClick = async () => {
    const robot = new Robot('192.168.1.0', 1);
    const result = await window.electronAPI.manageRobots.addRobot(robot);
    updateRobotsList(result);
  };

  useEffect(() => {
    async function fetchData() {
      const result = await window.electronAPI.manageRobots.loadRobots();
      updateRobotsList(result);
    }

    fetchData();
  }, []);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        PuckLab Robots Management
      </Typography>
      <Typography variant="body1" gutterBottom>
        Manage your robots configuration here.
      </Typography>

      <Button variant="contained" color="primary" onClick={onClick}>
        Add Robot
      </Button>

      {error && (
        <Typography variant="body1" color="error" sx={{ marginTop: 2 }}>
          Error: {error}
        </Typography>
      )}

      <Box sx={{ marginTop: 2 }}>
        <Typography variant="h6">Current Robots:</Typography>
        {robots.length > 0 ? (
          <List sx={{ marginTop: 1 }}>
            {robots.map((robot, index) => (
              <ListItem key={index}>
                <Typography variant="body1">
                  {robot.ipAddress}:{robot.port} - ID : {robot.id}
                </Typography>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1">No robots configured.</Typography>
        )}
      </Box>
    </Box>
  );
};

const root = createRoot(document.body);
root.render(<App />);
