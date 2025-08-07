import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import nl from './locales/nl.json';
import de from './locales/de.json';

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'de', name: 'Deutsch' },
];

// We'll initialize with debug disabled, and enable it after checking isPackaged
let isDebugEnabled = false;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      nl: { translation: nl },
      de: { translation: de },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    debug: isDebugEnabled,
  });

// Check if we're in development mode and enable debug if so
window.electronAPI.app
  .isPackaged()
  .then(isPackaged => {
    if (!isPackaged && !isDebugEnabled) {
      isDebugEnabled = true;
      i18n.options.debug = true;
      console.log('i18next debug mode enabled (development)');
    }
  })
  .catch(() => {
    // If electronAPI is not available, assume production
    console.log(
      'i18next: electronAPI not available, running in production mode'
    );
  });

export default i18n;
