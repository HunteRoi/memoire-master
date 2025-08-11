import { Box, Button, Container, Typography } from '@mui/material';
import type React from 'react';
import { type ReactNode, useEffect } from 'react';
import { LanguageSelector } from '../languageSelector';

interface PageLayoutProps {
  title: string;
  subtitle?: string | null;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  continueDisabled?: boolean;
  continueText?: string | null;
  backText?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  centered?: boolean;
  defaultLabels: {
    back: string;
    continue: string;
  };
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  children,
  onBack,
  onContinue,
  onNavigateLeft,
  onNavigateRight,
  onNavigateUp,
  onNavigateDown,
  continueDisabled = false,
  continueText,
  backText,
  maxWidth = 'md',
  centered = true,
  defaultLabels,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Check if there's an open dialog or modal that should handle the event
      const isDialogOpen = document.querySelector('[role="dialog"]') !== null;
      const isModalOpen = document.querySelector('[role="presentation"]') !== null;

      // Don't handle global shortcuts if a dialog/modal is open
      if (isDialogOpen || isModalOpen) {
        return;
      }

      if (
        (event.key === 'Enter' || event.key === 'NumpadEnter') &&
        onContinue &&
        !continueDisabled
      ) {
        event.preventDefault();
        onContinue();
      } else if (event.key === 'Backspace' && onBack && !isInputElement) {
        event.preventDefault();
        onBack();
      } else if (
        event.key === 'ArrowLeft' &&
        onNavigateLeft &&
        !isInputElement
      ) {
        event.preventDefault();
        onNavigateLeft();
      } else if (
        event.key === 'ArrowRight' &&
        onNavigateRight &&
        !isInputElement
      ) {
        event.preventDefault();
        onNavigateRight();
      } else if (event.key === 'ArrowUp' && onNavigateUp && !isInputElement) {
        event.preventDefault();
        onNavigateUp();
      } else if (
        event.key === 'ArrowDown' &&
        onNavigateDown &&
        !isInputElement
      ) {
        event.preventDefault();
        onNavigateDown();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onBack,
    onContinue,
    onNavigateLeft,
    onNavigateRight,
    onNavigateUp,
    onNavigateDown,
    continueDisabled,
  ]);

  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        color: 'text.primary',
        height: '100vh',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Language Selector - positioned in top right */}
      <Box
        sx={{
          position: 'absolute',
          top: {
            xs: 8,
            sm: 16,
          },
          right: {
            xs: 8,
            sm: 16,
          },
          zIndex: 1000,
        }}
      >
        <LanguageSelector />
      </Box>

      <Container
        maxWidth={maxWidth}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          display='flex'
          flexDirection='column'
          alignItems={centered ? 'center' : 'flex-start'}
          height='100%'
          py={
            {
              xs: 2,
              sm: 3,
              md: 4,
            }
          }
          sx={{
            overflow: 'auto',
          }}
        >
          <Typography
            variant='h1'
            component='h1'
            gutterBottom
            align={centered ? 'center' : 'left'}
            sx={{
              mb: {
                xs: 1,
                sm: 2,
              },
              fontSize: {
                xs: '2rem',
                sm: '2.5rem',
                md: '3rem',
              },
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant='h3'
              component='p'
              gutterBottom
              align={centered ? 'center' : 'left'}
              color='text.secondary'
              sx={{
                mb: {
                  xs: 2,
                  sm: 3,
                  md: 4,
                },
                fontSize: {
                  xs: '1.1rem',
                  sm: '1.3rem',
                  md: '1.5rem',
                },
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          )}

          <Box
            sx={{
              flex: 1,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: centered ? 'center' : 'flex-start',
              mb: {
                xs: 2,
                sm: 3,
                md: 4,
              },
              overflow: 'auto',
            }}
          >
            {children}
          </Box>

          <Box
            display='flex'
            gap={{
              xs: 1,
              sm: 2,
            }}
            justifyContent='center'
            sx={{
              mt: 'auto',
              pt: {
                xs: 1,
                sm: 2,
              },
              flexShrink: 0,
            }}
          >
            {onBack && (
              <Button
                variant='outlined'
                size='large'
                onClick={onBack}
                sx={{
                  minWidth: {
                    xs: 140,
                    sm: 240,
                  },
                  fontSize: {
                    xs: '1rem',
                    sm: '1.2rem',
                  },
                  py: {
                    xs: 1,
                    sm: 1.5,
                  },
                }}
              >
                {backText || defaultLabels.back}
              </Button>
            )}
            {onContinue && (
              <Button
                variant='contained'
                size='large'
                onClick={onContinue}
                disabled={continueDisabled}
                sx={{
                  minWidth: {
                    xs: 140,
                    sm: 240,
                  },
                  fontSize: {
                    xs: '1rem',
                    sm: '1.2rem',
                  },
                  py: {
                    xs: 1,
                    sm: 1.5,
                  },
                }}
              >
                {continueText || defaultLabels.continue}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
