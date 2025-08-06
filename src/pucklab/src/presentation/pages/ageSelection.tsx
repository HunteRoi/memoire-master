import { ChangeEvent, FC, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Card, CardContent, FormControl, InputAdornment, TextField } from '@mui/material';

import { useAppContext } from '../hooks/useAppContext';
import { useEnsureData } from '../hooks/useEnsureData';
import { Age } from '../types/Age';
import { PageLayout } from '../components/layout/layout';

export const AgeSelection: FC = () => {
  const navigate = useNavigate();
  const { setUserAge } = useAppContext();
  const [age, setAge] = useState<number>(10);

  useEnsureData();

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

  return (
    <PageLayout
      title="What's Your Age?"
      subtitle="This helps us customize the interface just for you"
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '50vh',
          mt: 4
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 500, minHeight: 180 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
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
      </Box>
    </PageLayout>
  );
};
