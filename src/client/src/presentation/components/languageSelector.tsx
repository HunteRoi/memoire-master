import React from 'react';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { Language } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import 'flag-icons/css/flag-icons.min.css';

import { languages } from '../i18n';
import { useAppContext } from '../hooks/useAppContext';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useAppContext();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentLanguage =
    languages.find(lang => lang.code === language) || languages[0];

  const getFlagClass = (langCode: string) => {
    switch (langCode) {
      case 'en':
        return 'fi fi-us'; // US flag for English
      case 'fr':
        return 'fi fi-fr'; // French flag
      case 'nl':
        return 'fi fi-nl'; // Dutch flag
      case 'de':
        return 'fi fi-de'; // German flag
      default:
        return '';
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Change i18n language first for immediate effect
      await i18n.changeLanguage(languageCode);

      // Update global app state
      setLanguage(languageCode);

      // Persist the selection
      localStorage.setItem('pucklab-language', languageCode);

      // Close the dropdown
      handleClose();

      console.log('Language changed to:', languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <Box>
      <Button
        variant='outlined'
        startIcon={<Language />}
        onClick={handleClick}
        sx={{
          textTransform: 'none',
          minWidth: 120,
          justifyContent: 'flex-start',
        }}
      >
        <Typography variant='body2'>{currentLanguage.name}</Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {languages.map(lang => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === language}
            sx={{ minWidth: 150 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span
                className={getFlagClass(lang.code)}
                style={{ width: '20px', height: '15px' }}
              />
              <Typography variant='body2'>{lang.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
