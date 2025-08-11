import { Box, Button } from '@mui/material';
import type { FC, PropsWithChildren, ReactNode } from 'react';

const PanelComponent: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {children}
    </Box>
  );
};

const LeftPanel: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      sx={{
        width: '20%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
        width: '80%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  );
};

const TopPanel: FC<PropsWithChildren<{ height?: string }>> = ({
  children,
  height = '100%',
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
}

const FloatingButton: FC<FloatingButtonProps> = ({
  icon,
  onClick,
  children,
}) => {
  return (
    <Button
      variant='contained'
      onClick={onClick}
      startIcon={icon}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 998,
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
