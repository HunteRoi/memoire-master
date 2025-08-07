import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Radio,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useTranslation } from 'react-i18next';

import type { ThemeOption } from '../models/Theme';

interface ThemePreviewCardProps {
  themeOption: ThemeOption;
  isSelected: boolean;
  onSelect: (themeType: ThemeOption['type']) => void;
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  themeOption,
  isSelected,
  onSelect,
}) => {
  const { t } = useTranslation();

  const getThemeName = (themeType: string) => {
    return t(`theme.names.${themeType.toLowerCase()}`);
  };

  const getThemeDescription = (themeType: string) => {
    return t(`theme.descriptions.${themeType.toLowerCase()}`);
  };

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
        {/* Selection Radio */}
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

        {/* Theme Preview Area */}
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
          {/* Color Swatches */}
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

          {/* Typography Preview */}
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

        {/* Theme Details */}
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
            {getThemeName(themeOption.type)}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: themeOption.theme.colors.text.secondary,
            }}
          >
            {getThemeDescription(themeOption.type)}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
