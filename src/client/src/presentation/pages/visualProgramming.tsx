import { FC } from 'react';
import { Box } from '@mui/material';

import { useAppContext } from '../hooks/useAppContext';
import { VisualProgrammingContent } from '../containers/visualProgrammingContent';

export const VisualProgramming: FC = () => {
  const { userAge } = useAppContext();
  const isSimpleMode = userAge?.isSimpleMode() ?? false;

  return (
    <Box sx={{ height: '100vh', display: 'flex', position: 'relative' }}>
      <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
        <VisualProgrammingContent isSimpleMode={isSimpleMode} />
      </Box>
    </Box>
  );
};