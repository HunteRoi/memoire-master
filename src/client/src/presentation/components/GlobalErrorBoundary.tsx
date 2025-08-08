import {
  BugReport,
  ContentCopy,
  ErrorOutline,
  ExpandLess,
  ExpandMore,
  Refresh,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import type { FC, PropsWithChildren } from 'react';
import { useState } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

const Fallback: FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(error.stack || error.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn('Failed to copy error to clipboard');
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Box
      role='alert'
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.1)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          boxShadow: theme.shadows[8],
          borderTop: `4px solid ${theme.palette.error.main}`,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} alignItems='center'>
            {/* Error Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ErrorOutline
                sx={{
                  fontSize: 40,
                  color: theme.palette.error.main,
                }}
              />
            </Box>

            {/* Main Error Message */}
            <Stack spacing={1} alignItems='center' textAlign='center'>
              <Typography variant='h4' color='error' gutterBottom>
                Oops! Something went wrong
              </Typography>
              <Typography
                variant='body1'
                color='text.secondary'
                sx={{ maxWidth: 400 }}
              >
                We encountered an unexpected error. Don't worry, this has been
                logged and our team will look into it.
              </Typography>
            </Stack>

            {/* Error Type Chip */}
            <Chip
              icon={<BugReport />}
              label={error.name || 'Application Error'}
              color='error'
              variant='outlined'
            />

            {/* Action Buttons */}
            <Stack direction='row' spacing={2}>
              <Button
                variant='contained'
                color='primary'
                startIcon={<Refresh />}
                onClick={resetErrorBoundary || handleReload}
                size='large'
              >
                Try Again
              </Button>
              <Button
                variant='outlined'
                onClick={() => setShowDetails(!showDetails)}
                endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
              >
                Show Details
              </Button>
            </Stack>

            {/* Collapsible Error Details */}
            <Collapse in={showDetails} sx={{ width: '100%' }}>
              <Card variant='outlined' sx={{ mt: 2 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Typography variant='h6' color='error'>
                        Error Details
                      </Typography>
                      <IconButton
                        size='small'
                        onClick={handleCopyError}
                        color={copied ? 'success' : 'default'}
                        title='Copy error details'
                      >
                        <ContentCopy fontSize='small' />
                      </IconButton>
                    </Stack>

                    <Typography variant='body2' color='text.secondary'>
                      <strong>Message:</strong>
                    </Typography>
                    <Typography
                      variant='body2'
                      component='pre'
                      sx={{
                        backgroundColor: alpha(theme.palette.error.main, 0.05),
                        p: 2,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        maxHeight: 200,
                        overflow: 'auto',
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      }}
                    >
                      {error.message}
                    </Typography>

                    {error.stack && (
                      <>
                        <Typography variant='body2' color='text.secondary'>
                          <strong>Stack Trace:</strong>
                        </Typography>
                        <Typography
                          variant='body2'
                          component='pre'
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.grey[500],
                              0.1
                            ),
                            p: 2,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            maxHeight: 300,
                            overflow: 'auto',
                            border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                            color: theme.palette.text.secondary,
                          }}
                        >
                          {error.stack}
                        </Typography>
                      </>
                    )}

                    {copied && (
                      <Chip
                        label='Error details copied to clipboard!'
                        color='success'
                        size='small'
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Collapse>

            {/* Footer Help Text */}
            <Typography
              variant='caption'
              color='text.secondary'
              textAlign='center'
            >
              If the problem persists, please contact support or try refreshing
              the page.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export const GlobalErrorBoundary: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onReset={details => console.debug(details)}
    >
      {children}
    </ErrorBoundary>
  );
};
