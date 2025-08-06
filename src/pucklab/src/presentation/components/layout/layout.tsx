import React, { ReactNode } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';

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
  continueText = 'Continue',
  backText = 'Back',
  maxWidth = 'md',
  centered = true
}) => {
  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <Container maxWidth={maxWidth}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems={centered ? 'center' : 'flex-start'}
          minHeight="100vh"
          py={4}
        >
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            align={centered ? 'center' : 'left'}
            sx={{ mb: 2 }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="h3"
              component="p"
              gutterBottom
              align={centered ? 'center' : 'left'}
              color="text.secondary"
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
              mb: 4
            }}
          >
            {children}
          </Box>

          <Box
            display="flex"
            gap={2}
            justifyContent="center"
            sx={{ mt: 'auto' }}
          >
            {onBack && (
              <Button
                variant="outlined"
                size="large"
                onClick={onBack}
                sx={{ minWidth: 240, fontSize: '1.2rem', py: 1.5 }}
              >
                {backText}
              </Button>
            )}
            {onContinue && (
              <Button
                variant="contained"
                size="large"
                onClick={onContinue}
                disabled={continueDisabled}
                sx={{ minWidth: 240, fontSize: '1.2rem', py: 1.5 }}
              >
                {continueText}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
