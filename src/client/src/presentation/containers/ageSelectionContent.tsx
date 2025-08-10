import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputAdornment,
  TextField,
} from '@mui/material';
import { type ChangeEvent, type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../hooks/useAppContext';
import { Age } from '../models/Age';

export const AgeSelectionContent: FC = () => {
  const { t } = useTranslation();
  const { userAge, setUserAge } = useAppContext();
  const [age, setAge] = useState<number>(userAge?.value || 10);

  const handleTextFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const newAge = parseInt(event.target.value);
    if (!Number.isNaN(newAge) && newAge >= 1) {
      setAge(newAge);
      setUserAge(new Age(newAge));
    }
  };

  const handleArrowUpClick = () => {
    const newAge = Math.min(99, age + 1);
    setAge(newAge);
    setUserAge(new Age(newAge));
  };

  const handleArrowDownClick = () => {
    const newAge = Math.max(1, age - 1);
    setAge(newAge);
    setUserAge(new Age(newAge));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        mt: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 500, minHeight: 180 }}>
        <CardContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
          }}
        >
          <FormControl sx={{ m: 1 }}>
            <TextField
              type='number'
              value={age}
              onChange={handleTextFieldChange}
              variant='standard'
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
                  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                    {
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
                  max: 99,
                },
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Button
                          size='small'
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
                          size='small'
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
                    <InputAdornment position='end' sx={{ fontSize: '3rem' }}>
                      {t('age.yearsOld')}
                    </InputAdornment>
                  ),
                },
              }}
            />
          </FormControl>
        </CardContent>
      </Card>
    </Box>
  );
};
