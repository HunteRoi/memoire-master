import { ChangeEvent, FC, useState } from 'react';
import { useNavigate } from 'react-router';

import { useAppContext } from '../hooks/useAppContext';
import { Box, Button, Card, CardContent, Container, FormControl, FormHelperText, Grid, InputAdornment, inputBaseClasses, Slider, TextField, Typography } from '@mui/material';
import { Age } from '../types/Age';

export const AgeSelection: FC = () => {
  const navigate = useNavigate();
  const { setUserAge } = useAppContext();
  const [age, setAge] = useState<number>(10);

  const handleTextFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newAge = parseInt(event.target.value);
    if (!isNaN(newAge) && newAge >= 1) {
      setAge(newAge);
    }
  };
  const handleArrowUpClick = () => setAge(prev => Math.min(99, prev + 1));
  const handleArrowDownClick = () => setAge(prev => Math.max(1, prev - 1));

  const handleBack = () => navigate('/theme-selection');
  const handleContinue = () => {
    setUserAge(new Age(age));
    navigate('/robot-selection');
  };

  return <Container maxWidth="md">
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
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <FormControl sx={{ m: 1 }}>
            <TextField
              type="number"
              value={age}
              onChange={handleTextFieldChange}
              variant="standard"
              sx={{
                '& .MuiInput-underline:before': {
                  borderBottom: 'none',
                },
                '& .MuiInput-underline:after': {
                  borderBottom: 'none',
                },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                  borderBottom: 'none',
                },
                '& .MuiInputBase-input': {
                  fontSize: '4rem',
                  textAlign: 'center',
                  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                  '&[type=number]': {
                    MozAppearance: 'textfield',
                  },
                },
              }}
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 99
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Button
                          size="small"
                          onClick={handleArrowUpClick}
                          sx={{
                            minWidth: '30px',
                            height: '30px',
                            fontSize: '16px',
                            padding: 0,
                          }}
                        >
                          ▲
                        </Button>
                        <Button
                          size="small"
                          onClick={handleArrowDownClick}
                          sx={{
                            minWidth: '30px',
                            height: '30px',
                            fontSize: '16px',
                            padding: 0,
                          }}
                        >
                          ▼
                        </Button>
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" sx={{ fontSize: '3rem' }}>
                      years old
                    </InputAdornment>
                  ),
                },
              }}
            />
          </FormControl>
        </CardContent>
      </Card>

      <Box mt={6} display="flex" gap={2} justifyContent="center">
        <Button
          variant="outlined"
          size="large"
          onClick={handleBack}
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
  </Container>;
};
