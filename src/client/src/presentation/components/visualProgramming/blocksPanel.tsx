import React, { FC } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { getTranslatedBlockCategories, Block } from '../../types/BlockTypes';

interface BlocksPanelProps {
  isSimpleMode: boolean;
}

export const BlocksPanel: FC<BlocksPanelProps> = ({ isSimpleMode }) => {
  const { t } = useTranslation();
  const blockCategories = getTranslatedBlockCategories(t);

  return (
    <Paper
      elevation={2}
      sx={{
        width: '20%',
        height: '100%',
        overflow: 'auto',
        borderRadius: 0,
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: isSimpleMode ? 2 : 1.5 }}>
        <Typography
          variant={isSimpleMode ? 'h5' : 'h6'}
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: isSimpleMode ? '1.5rem' : '1.25rem',
          }}
        >
          🧩 {t('visualProgramming.blocks.title')}
        </Typography>

        {blockCategories.map(category => (
          <Accordion key={category.id} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                minHeight: isSimpleMode ? 56 : 48,
                '& .MuiAccordionSummary-content': {
                  margin: '8px 0',
                },
              }}
            >
              <Typography
                variant={isSimpleMode ? 'h6' : 'subtitle1'}
                sx={{ fontWeight: 500 }}
              >
                {category.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {category.blocks.map(block => (
                <BlockItem
                  key={block.id}
                  block={block}
                  isSimpleMode={isSimpleMode}
                />
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
};

const BlockItem: FC<{ block: Block; isSimpleMode: boolean }> = ({
  block,
  isSimpleMode,
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        p: isSimpleMode ? 2 : 1.5,
        mb: 1,
        cursor: 'grab',
        '&:hover': {
          elevation: 3,
          backgroundColor: 'action.hover',
        },
        transition: 'all 0.2s ease-in-out',
      }}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/reactflow', JSON.stringify(block));
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant='h6'
          component='span'
          sx={{ fontSize: isSimpleMode ? '2rem' : '1.5rem' }}
        >
          {block.icon}
        </Typography>
        <Typography
          variant={isSimpleMode ? 'body1' : 'body2'}
          sx={{
            fontWeight: 500,
            fontSize: isSimpleMode ? '1.1rem' : '0.875rem',
          }}
        >
          {block.name}
        </Typography>
      </Box>
    </Paper>
  );
};
