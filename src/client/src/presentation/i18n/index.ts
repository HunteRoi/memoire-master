import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// import Backend from 'i18next-fs-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';

import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import nl from './locales/nl.json';

// const backend = new Backend({
//   loadPath: './locales/{{lng}}.json'
// });

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
];

let isDebugEnabled = false;

i18n
  .use(initReactI18next)
  // .use(backend)
  // .use(LanguageDetector)
  .init({
    // supportedLngs: languages.map(lng => lng.code),
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      nl: { translation: nl },
      de: { translation: de },
      it: { translations: it },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    debug: isDebugEnabled,
  });

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
    console.log(
      'i18next: electronAPI not available, running in production mode'
    );
  });

export default i18n;
