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
      role='tooltip'
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
            padding: {
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            },
            altBoundary: true,
            mainAxis: true,
            altAxis: true,
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['top', 'bottom', 'right', 'left'],
            boundary: 'viewport',
            padding: 20,
          },
        },
        {
          name: 'computeStyles',
          options: {
            adaptive: true,
            roundOffsets: true,
          },
        },
        {
          name: 'ensureVisibility',
          enabled: true,
          phase: 'beforeWrite',
          fn: ({ state }) => {
            const { x, y } = state.modifiersData.popperOffsets || { x: 0, y: 0 };
            const { width: popperWidth, height: popperHeight } = state.rects.popper;
            const { width: viewportWidth, height: viewportHeight } = document.documentElement.getBoundingClientRect();
            
            // Ensure tooltip doesn't go outside viewport bounds
            let adjustedX = x;
            let adjustedY = y;
            
            // Check horizontal bounds
            if (x < 20) {
              adjustedX = 20;
            } else if (x + popperWidth > viewportWidth - 20) {
              adjustedX = viewportWidth - popperWidth - 20;
            }
            
            // Check vertical bounds  
            if (y < 20) {
              adjustedY = 20;
            } else if (y + popperHeight > viewportHeight - 20) {
              adjustedY = viewportHeight - popperHeight - 20;
            }
            
            state.modifiersData.popperOffsets.x = adjustedX;
            state.modifiersData.popperOffsets.y = adjustedY;
          },
        },
      ]}
      style={{ zIndex: 10000 }}
    >
      <Card
        elevation={8}
        sx={{
          maxWidth: {
            xs: 320,
            sm: 360,
          },
          minWidth: {
            xs: 240,
            sm: 280,
          },
          width: {
            xs: 'calc(100vw - 32px)',
            sm: 'auto',
          },
          backgroundColor: 'background.paper',
          border: `2px solid ${theme.palette.primary.main}`,
        }}
      >
        <CardContent 
          sx={{ 
            pb: 1,
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
              variant='h6'
              sx={{ 
                fontWeight: 600, 
                color: 'primary.main',
                fontSize: {
                  xs: '1.1rem',
                  sm: '1.25rem',
                },
                flex: 1,
                wordBreak: 'break-word',
              }}
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
          <Typography 
            variant='body2' 
            sx={{ 
              mb: 3, 
              lineHeight: 1.6,
              fontSize: {
                xs: '0.875rem',
                sm: '0.875rem',
              },
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
            <Box 
              sx={{ 
                display: 'flex', 
                gap: {
                  xs: 0.5,
                  sm: 1,
                },
                width: {
                  xs: '100%',
                  sm: 'auto',
                },
                justifyContent: {
                  xs: 'center',
                  sm: 'flex-start',
                },
              }}
            >
              <Button
                variant='outlined'
                size='small'
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
                size='small'
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
      </Card>
    </Popper>
  );
};
