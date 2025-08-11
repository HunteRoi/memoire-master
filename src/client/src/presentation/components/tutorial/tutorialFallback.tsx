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
        maxWidth: 400,
        width: '90vw',
      }}
    >
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant='h5'
            sx={{ fontWeight: 600, color: 'primary.main' }}
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
        <Typography variant='h6' sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant='body1' sx={{ mb: 3 }}>
          {content}
        </Typography>

        {/* Navigation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button variant='text' onClick={onClose}>
            {labels.skip}
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='outlined'
              onClick={onPrevious}
              disabled={isFirstStep}
              startIcon={<NavigateBefore />}
            >
              {labels.previous}
            </Button>

            <Button
              variant='contained'
              onClick={onNext}
              endIcon={isLastStep ? <PlayArrow /> : <NavigateNext />}
            >
              {isLastStep ? labels.finish : labels.next}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Paper>
  );
};
