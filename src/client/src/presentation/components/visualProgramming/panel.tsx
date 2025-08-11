import { Box, Button } from '@mui/material';
import type { FC, PropsWithChildren, ReactNode } from 'react';

const PanelComponent: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: {
          xs: 'column',
          sm: 'row',
        },
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
};

const LeftPanel: FC<PropsWithChildren<{ 'data-tutorial'?: string }>> = ({
  children,
  'data-tutorial': dataTutorial,
}) => {
  return (
    <Box
      data-tutorial={dataTutorial}
      sx={{
        width: {
          xs: '100%',
          sm: '30%',
          md: '25%',
          lg: '20%',
          xl: '18%',
        },
        height: {
          xs: 'auto',
          sm: '100%',
        },
        display: 'flex',
        flexDirection: 'column',
        minWidth: 250,
      }}
    >
      {children}
    </Box>
  );
};

const RightPanel: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      sx={{
        width: {
          xs: '100%',
          sm: '70%',
          md: '75%',
          lg: '80%',
          xl: '82%',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      {children}
    </Box>
  );
};

const TopPanel: FC<
  PropsWithChildren<{ height?: string; 'data-tutorial'?: string }>
> = ({ children, height = '100%', 'data-tutorial': dataTutorial }) => {
  return (
    <Box
      data-tutorial={dataTutorial}
      sx={{
        width: '100%',
        height,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  );
};

const BottomPanel: FC<PropsWithChildren<{ height?: string }>> = ({
  children,
  height = '33%',
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        height,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  );
};

interface FloatingButtonProps {
  icon?: ReactNode;
  onClick: () => void;
  children: ReactNode;
  'data-tutorial'?: string;
}

const FloatingButton: FC<FloatingButtonProps> = ({
  icon,
  onClick,
  children,
  'data-tutorial': dataTutorial,
}) => {
  return (
    <Button
      variant='contained'
      onClick={onClick}
      startIcon={icon}
      data-tutorial={dataTutorial}
      sx={{
        position: 'fixed',
        bottom: {
          xs: 80,
          sm: 16,
        },
        right: {
          xs: 16,
          sm: 16,
        },
        zIndex: 998,
        fontSize: {
          xs: '0.8rem',
          sm: '0.875rem',
        },
        padding: {
          xs: '8px 12px',
          sm: '8px 16px',
        },
      }}
    >
      {children}
    </Button>
  );
};

export const Panel = Object.assign(PanelComponent, {
  LeftPanel,
  RightPanel,
  TopPanel,
  BottomPanel,
  FloatingButton,
});
