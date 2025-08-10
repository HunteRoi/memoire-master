import { Box, Button, Container, Typography } from '@mui/material';
import type React from 'react';
import { type ReactNode, useEffect, useRef } from 'react';
import { LanguageSelector } from '../languageSelector';

interface PageLayoutProps {
  title: string;
  subtitle?: string | null;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
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
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

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
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack, onContinue, continueDisabled]);

  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
      }}
    >
      {/* Language Selector - positioned in top right */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <LanguageSelector />
      </Box>

      <Container maxWidth={maxWidth}>
        <Box
          display='flex'
          flexDirection='column'
          alignItems={centered ? 'center' : 'flex-start'}
          minHeight='100vh'
          py={4}
        >
          <Typography
            variant='h1'
            component='h1'
            gutterBottom
            align={centered ? 'center' : 'left'}
            sx={{ mb: 2 }}
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
              sx={{ mb: 4 }}
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
              mb: 4,
            }}
          >
            {children}
          </Box>

          <Box
            display='flex'
            gap={2}
            justifyContent='center'
            sx={{ mt: 'auto' }}
          >
            {onBack && (
              <Button
                variant='outlined'
                size='large'
                onClick={onBack}
                sx={{ minWidth: 240, fontSize: '1.2rem', py: 1.5 }}
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
                sx={{ minWidth: 240, fontSize: '1.2rem', py: 1.5 }}
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
