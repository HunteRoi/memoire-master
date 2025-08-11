import {
  Close,
  NavigateBefore,
  NavigateNext,
  PlayArrow,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Popper,
  Typography,
  useTheme,
} from '@mui/material';
import type { FC } from 'react';

export interface TutorialTooltipProps {
  anchorEl: HTMLElement | null;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
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
  };
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export const TutorialTooltip: FC<TutorialTooltipProps> = ({
  anchorEl,
  title,
  content,
  placement,
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  labels,
  onNext,
  onPrevious,
  onClose,
}) => {
  const theme = useTheme();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Popper
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      placement={placement}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 16],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 16,
          },
        },
      ]}
      style={{ zIndex: 10000 }}
    >
      <Card
        elevation={8}
        sx={{
          maxWidth: 360,
          minWidth: 280,
          backgroundColor: 'background.paper',
          border: `2px solid ${theme.palette.primary.main}`,
        }}
      >
        <CardContent sx={{ pb: 1 }}>
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
              variant='h6'
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              {title}
            </Typography>
            <IconButton size='small' onClick={onClose}>
              <Close fontSize='small' />
            </IconButton>
          </Box>

          {/* Progress */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ mb: 0.5, display: 'block' }}
            >
              {labels.step} {currentStep + 1} {labels.of} {totalSteps}
            </Typography>
            <LinearProgress
              variant='determinate'
              value={progress}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Content */}
          <Typography variant='body2' sx={{ mb: 3, lineHeight: 1.6 }}>
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant='outlined'
                size='small'
                onClick={onPrevious}
                disabled={isFirstStep}
                startIcon={<NavigateBefore />}
              >
                {labels.previous}
              </Button>

              <Button
                variant='contained'
                size='small'
                onClick={onNext}
                endIcon={isLastStep ? <PlayArrow /> : <NavigateNext />}
              >
                {isLastStep ? labels.finish : labels.next}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Popper>
  );
};
