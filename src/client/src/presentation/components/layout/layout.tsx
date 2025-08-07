import React, { ReactNode, useEffect } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueText?: string;
  backText?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  centered?: boolean;
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
}) => {
  const { t } = useTranslation();

  // Add keyboard event listeners for Enter and Backspace keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Enter key (main keyboard and numpad) for continue button
      if (
        (event.key === 'Enter' || event.key === 'NumpadEnter') &&
        onContinue &&
        !continueDisabled
      ) {
        event.preventDefault();
        onContinue();
      }
      // Handle Backspace key for back button
      else if (event.key === 'Backspace' && onBack) {
        event.preventDefault();
        onBack();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove event listener
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
      }}
    >
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
                {backText || t('common.back')}
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
                {continueText || t('common.continue')}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
