import {
  Close,
  NavigateBefore,
  NavigateNext,
  PlayArrow,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CardContent,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import type { FC } from 'react';

export interface TutorialFallbackProps {
  title: string;
  content: string;
  tutorialTitle: string;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  labels: {
    step: string;
    of: string;
    previous: string;
    next: string;
    finish: string;
    skip: string;
  };
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export const TutorialFallback: FC<TutorialFallbackProps> = ({
  title,
  content,
  tutorialTitle,
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  labels,
  onNext,
  onPrevious,
  onClose,
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        maxWidth: {
          xs: 350,
          sm: 400,
        },
        width: {
          xs: 'calc(100vw - 32px)',
          sm: '90vw',
        },
        maxHeight: {
          xs: 'calc(100vh - 32px)',
          sm: '90vh',
        },
        overflow: 'auto',
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            gap: 1,
          }}
        >
          <Typography
            variant='h5'
            sx={{ 
              fontWeight: 600, 
              color: 'primary.main',
              fontSize: {
                xs: '1.25rem',
                sm: '1.5rem',
              },
              flex: 1,
              wordBreak: 'break-word',
            }}
          >
            {tutorialTitle}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            {labels.step} {currentStep + 1} {labels.of} {totalSteps}
          </Typography>
          <LinearProgress
            variant='determinate'
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
            }}
          />
        </Box>

        {/* Content */}
        <Typography 
          variant='h6' 
          sx={{ 
            mb: 1,
            fontSize: {
              xs: '1.1rem',
              sm: '1.25rem',
            },
            wordBreak: 'break-word',
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant='body1' 
          sx={{ 
            mb: 3,
            fontSize: {
              xs: '0.875rem',
              sm: '1rem',
            },
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {content}
        </Typography>

        {/* Navigation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: {
              xs: 'wrap',
              sm: 'nowrap',
            },
            gap: {
              xs: 1,
              sm: 0,
            },
          }}
        >
          <Button 
            variant='text' 
            onClick={onClose}
            sx={{
              fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
              },
            }}
          >
            {labels.skip}
          </Button>

          <Box 
            sx={{ 
              display: 'flex', 
              gap: {
                xs: 0.5,
                sm: 1,
              },
              order: {
                xs: 3,
                sm: 0,
              },
              width: {
                xs: '100%',
                sm: 'auto',
              },
              justifyContent: {
                xs: 'center',
                sm: 'flex-end',
              },
            }}
          >
            <Button
              variant='outlined'
              onClick={onPrevious}
              disabled={isFirstStep}
              startIcon={<NavigateBefore />}
              sx={{
                fontSize: {
                  xs: '0.75rem',
                  sm: '0.875rem',
                },
                minWidth: {
                  xs: 80,
                  sm: 100,
                },
              }}
            >
              {labels.previous}
            </Button>

            <Button
              variant='contained'
              onClick={onNext}
              endIcon={isLastStep ? <PlayArrow /> : <NavigateNext />}
              sx={{
                fontSize: {
                  xs: '0.75rem',
                  sm: '0.875rem',
                },
                minWidth: {
                  xs: 80,
                  sm: 100,
                },
              }}
            >
              {isLastStep ? labels.finish : labels.next}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Paper>
  );
};
