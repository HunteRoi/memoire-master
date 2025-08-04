import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { RobotCard } from '../components/RobotCard';
import { RobotDialog } from '../components/RobotDialog';
import { useAppContext } from '../context/AppContext';
import { useUseCases } from '../hooks/useUseCases';
import { Robot } from '../../domain/entities/Robot';

export const RobotSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setSelectedRobot, updateRobot, setError, setRobotsList } = useAppContext();
  const { manageRobotsUseCase, robotConnectionUseCase } = useUseCases();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [robotToConnect, setRobotToConnect] = useState<Robot | null>(null);

  const selectedRobotData = state.robotsList.find(r => r.id === state.selectedRobot);

  const handleAddRobot = () => {
    setEditingRobot(null);
    setDialogOpen(true);
  };

  const handleEditRobot = (robot: Robot) => {
    setEditingRobot(robot);
    setDialogOpen(true);
  };

  const handleDeleteRobot = async (robotId: string) => {
    try {
      await manageRobotsUseCase.removeRobot(robotId);

      // Reload robots list and update context
      const updatedRobots = await manageRobotsUseCase.loadRobots();
      setRobotsList(updatedRobots);

    } catch (error) {
      console.error('Failed to delete robot:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete robot');
    }
  };

  const handleSaveRobot = async (robot: Robot) => {
    try {
      if (editingRobot) {
        await manageRobotsUseCase.updateRobot(robot);
      } else {
        await manageRobotsUseCase.addRobot(robot);
      }

      setDialogOpen(false);
      setEditingRobot(null);

      // Reload robots list and update context
      const updatedRobots = await manageRobotsUseCase.loadRobots();
      setRobotsList(updatedRobots);

    } catch (error) {
      console.error('Failed to save robot:', error);
      setError(error instanceof Error ? error.message : 'Failed to save robot configuration');
    }
  };

  const handleRobotSelect = (robot: Robot) => {
    setRobotToConnect(robot);
    setConfirmDialogOpen(true);
  };

  const handleConfirmConnect = async () => {
    if (!robotToConnect) return;

    setConfirmDialogOpen(false);

    try {
      const connectedRobot = await robotConnectionUseCase.connectToRobot(robotToConnect);
      updateRobot(connectedRobot);
      setSelectedRobot(robotToConnect.id);
    } catch (error) {
      console.error('Robot connection failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to robot');
    } finally {
      setRobotToConnect(null);
    }
  };

  const handleCancelConnect = () => {
    setConfirmDialogOpen(false);
    setRobotToConnect(null);
  };

  const handleContinue = () => {
    if (selectedRobotData?.isConnected) {
      navigate('/mode-selection');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Select Your Robot
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Choose a robot from your saved list or add a new one. Make sure your robot is powered on and connected to the network.
      </Typography>

      <Grid container spacing={2} mb={3}>
        {state.robotsList.map((robot) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={robot.id}>
            <RobotCard
              robot={robot}
              onSelect={handleRobotSelect}
              onEdit={handleEditRobot}
              onDelete={handleDeleteRobot}
              selected={state.selectedRobot === robot.id}
            />
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
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
            onClick={handleAddRobot}
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
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          onClick={() => navigate('/age-selection')}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!selectedRobotData?.isConnected}
        >
          Continue
        </Button>
      </Box>

      <RobotDialog
        open={dialogOpen}
        robot={editingRobot}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveRobot}
      />

      <Dialog open={confirmDialogOpen} onClose={handleCancelConnect} maxWidth="sm" fullWidth>
        <DialogTitle>
          Connect to {robotToConnect?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to connect to <strong>{robotToConnect?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConnect}>
            Cancel
          </Button>
          <Button onClick={handleConfirmConnect} variant="contained">
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
