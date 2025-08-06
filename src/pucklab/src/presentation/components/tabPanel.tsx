import { ReactNode, FC } from 'react';
import { Box } from '@mui/material';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

export const TabPanel: FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);
