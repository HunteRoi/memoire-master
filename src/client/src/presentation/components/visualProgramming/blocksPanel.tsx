import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import type { FC } from 'react';

import type { Block } from '../../models/BlockTypes';
import { blockCategories } from '../../models/BlockTypes';

export interface BlocksPanelLabels {
  title: string;
  categories: {
    movement: string;
    sound: string;
    leds: string;
    sensors: string;
    control: string;
  };
  blockNames: Record<string, string>;
  blockDescriptions: Record<string, string>;
}

interface BlocksPanelProps {
  isSimpleMode: boolean;
  labels: BlocksPanelLabels;
  onBlockClick?: (block: Block) => void;
}

export const BlocksPanel: FC<BlocksPanelProps> = ({
  isSimpleMode,
  labels,
  onBlockClick,
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        borderRadius: 0,
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: isSimpleMode ? 2 : 1.5, pb: 3 }}>
        <Typography
          variant={isSimpleMode ? 'h5' : 'h6'}
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: isSimpleMode ? '1.5rem' : '1.25rem',
          }}
        >
          🧩 {labels.title}
        </Typography>

        <div data-tutorial='block-categories'>
          {blockCategories.map((category, index) => (
            <Accordion
              key={category.id}
              defaultExpanded={index === 0}
              sx={{ mb: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  minHeight: isSimpleMode ? 56 : 48,
                  backgroundColor: `${category.color}08`,
                  borderLeft: `4px solid ${category.color}`,
                  '& .MuiAccordionSummary-content': {
                    margin: '8px 0',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant='h6'
                    component='span'
                    sx={{ fontSize: isSimpleMode ? '1.5rem' : '1.25rem' }}
                  >
                    {category.icon}
                  </Typography>
                  <Typography
                    variant={isSimpleMode ? 'h6' : 'subtitle1'}
                    sx={{ fontWeight: 500 }}
                  >
                    {
                      labels.categories[
                        category.id as keyof typeof labels.categories
                      ]
                    }
                  </Typography>
                  <Chip
                    label={category.blocks.length}
                    size='small'
                    sx={{
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                      fontWeight: 600,
                      minWidth: '24px',
                      height: '20px',
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {category.blocks.map((block, index) => (
                  <BlockItem
                    data-tutorial={
                      index === 0 && category.id === 'movement'
                        ? 'first-block'
                        : undefined
                    }
                    key={block.id}
                    {...block}
                    name={labels.blockNames[block.id] || block.name}
                    description={
                      labels.blockDescriptions[block.id] || block.description
                    }
                    isSimpleMode={isSimpleMode}
                    categoryColor={category.color}
                    onBlockClick={onBlockClick}
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </Box>
    </Paper>
  );
};

const BlockItem: FC<
  {
    isSimpleMode: boolean;
    categoryColor: string;
    onBlockClick?: (block: Block) => void;
    'data-tutorial'?: string;
  } & Block
> = ({
  isSimpleMode,
  categoryColor,
  onBlockClick,
  'data-tutorial': dataTutorial,
  ...block
}) => {
  return (
    <Paper
      elevation={1}
      data-tutorial={dataTutorial}
      sx={{
        p: isSimpleMode ? 2 : 1.5,
        mb: 1,
        cursor: 'grab',
        borderLeft: `3px solid ${categoryColor}`,
        '&:hover': {
          elevation: 3,
          backgroundColor: `${categoryColor}08`,
          borderLeft: `3px solid ${categoryColor}`,
          transform: 'translateX(4px)',
        },
        '&:active': {
          cursor: 'grabbing',
          transform: 'scale(0.98)',
        },
        transition: 'all 0.2s ease-in-out',
      }}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/reactflow', JSON.stringify(block));
      }}
      onClick={() => onBlockClick?.(block)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography
          variant='h6'
          component='span'
          sx={{
            fontSize: isSimpleMode ? '2rem' : '1.5rem',
            filter: 'grayscale(0.2)',
          }}
        >
          {block.icon}
        </Typography>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant={isSimpleMode ? 'body1' : 'body2'}
            sx={{
              fontWeight: 600,
              fontSize: isSimpleMode ? '1.1rem' : '0.875rem',
              color: 'text.primary',
            }}
          >
            {block.name}
          </Typography>
          {!isSimpleMode && (
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                display: 'block',
                mt: 0.25,
              }}
            >
              {block.description}
            </Typography>
          )}
          {block.parameters && block.parameters.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              {block.parameters.slice(0, isSimpleMode ? 1 : 3).map(param => (
                <Chip
                  key={param.id}
                  label={param.name}
                  size='small'
                  variant='outlined'
                  sx={{
                    height: '16px',
                    fontSize: '0.625rem',
                    borderColor: `${categoryColor}40`,
                    color: categoryColor,
                    '& .MuiChip-label': {
                      px: 0.5,
                    },
                  }}
                />
              ))}
              {block.parameters.length > (isSimpleMode ? 1 : 3) && (
                <Chip
                  label={`+${block.parameters.length - (isSimpleMode ? 1 : 3)}`}
                  size='small'
                  variant='filled'
                  sx={{
                    height: '16px',
                    fontSize: '0.625rem',
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor,
                    '& .MuiChip-label': {
                      px: 0.5,
                    },
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};
