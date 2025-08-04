import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  TextField,
  Card,
  CardContent,
  Slider,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const AgeSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [age, setAge] = useState<number>(10);

  const handleAgeChange = (event: Event, newValue: number | number[]) => {
    setAge(newValue as number);
  };

  const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 6 && value <= 18) {
      setAge(value);
    }
  };

  const handleContinue = () => {
    navigate('/robot-selection');
  };

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        minHeight="100vh"
        py={4}
      >
        <Typography variant="h1" component="h1" gutterBottom align="center">
          What's Your Age?
        </Typography>

        <Typography variant="h3" component="p" gutterBottom align="center" color="text.secondary">
          This helps us customize the interface just for you
        </Typography>

        <Card sx={{ mt: 4, width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="h4" gutterBottom align="center">
                  {age} years old
                </Typography>

                <Slider
                  value={age}
                  onChange={handleAgeChange}
                  min={6}
                  max={18}
                  marks={[
                    { value: 6, label: '6' },
                    { value: 9, label: '9' },
                    { value: 12, label: '12' },
                    { value: 15, label: '15' },
                    { value: 18, label: '18' }
                  ]}
                  valueLabelDisplay="off"
                  sx={{ mt: 2, mb: 3 }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Enter age"
                  type="number"
                  value={age}
                  onChange={handleTextFieldChange}
                  inputProps={{ min: 6, max: 18 }}
                  fullWidth
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box mt={6} display="flex" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/theme-selection')}
            sx={{ minWidth: 200 }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleContinue}
            sx={{ minWidth: 200 }}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
