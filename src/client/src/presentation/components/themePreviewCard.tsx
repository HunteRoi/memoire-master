import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Radio,
  Typography,
} from '@mui/material';
import type React from 'react';

import type { ThemeOption } from '../models/Theme';

export interface ThemePreviewCardLabels {
  themeName: string;
  themeDescription: string;
}

interface ThemePreviewCardProps {
  themeOption: ThemeOption;
  isSelected: boolean;
  onSelect: (themeType: ThemeOption['type']) => void;
  labels: ThemePreviewCardLabels;
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  themeOption,
  isSelected,
  onSelect,
  labels,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: isSelected ? 3 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardActionArea
        onClick={() => onSelect(themeOption.type)}
        sx={{ height: '100%', position: 'relative' }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <Radio
            checked={isSelected}
            onChange={() => onSelect(themeOption.type)}
          />
        </Box>

        <Box
          sx={{
            backgroundColor: themeOption.theme.colors.background.default,
            color: themeOption.theme.colors.text.primary,
            height: 140,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: themeOption.theme.colors.primary.main,
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: themeOption.theme.colors.secondary.main,
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: themeOption.theme.colors.accent,
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </Box>

          <Typography
            variant='h4'
            sx={{
              color: themeOption.theme.colors.primary.main,
              fontWeight: 'bold',
            }}
          >
            Aa
          </Typography>
        </Box>

        <CardContent
          sx={{
            backgroundColor: themeOption.theme.colors.background.paper,
            color: themeOption.theme.colors.text.primary,
            borderTop: `4px solid ${themeOption.theme.colors.primary.main}`,
          }}
        >
          <Typography
            variant='h6'
            component='h2'
            gutterBottom
            sx={{
              color: themeOption.theme.colors.primary.main,
              fontWeight: 'bold',
            }}
          >
            {labels.themeName}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: themeOption.theme.colors.text.secondary,
            }}
          >
            {labels.themeDescription}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
