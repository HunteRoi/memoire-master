import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

import './pythonCodeViewer.css';

import deTranslations from '../presentation/i18n/locales/de.json';
import enTranslations from '../presentation/i18n/locales/en.json';
import frTranslations from '../presentation/i18n/locales/fr.json';
import itTranslations from '../presentation/i18n/locales/it.json';
import nlTranslations from '../presentation/i18n/locales/nl.json';

const translations = {
  en: enTranslations,
  fr: frTranslations,
  de: deTranslations,
  nl: nlTranslations,
  it: itTranslations,
};

let currentLanguage = 'en';

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function t(key: string, fallback: string = key): string {
  const currentTranslations =
    translations[currentLanguage as keyof typeof translations];
  const translation = getNestedValue(currentTranslations, key);

  if (translation) return translation;

  const englishTranslation = getNestedValue(translations.en, key);
  return englishTranslation || fallback;
}

function updateTranslations(): void {
  const elements = {
    windowTitle: document.getElementById('windowTitle'),
    headerTitle: document.getElementById('headerTitle'),
    readOnlyBadge: document.getElementById('readOnlyBadge'),
    closeButton: document.getElementById('closeButton'),
    updateIndicator: document.getElementById('updateIndicator'),
  };

  if (elements.windowTitle)
    elements.windowTitle.textContent = t(
      'visualProgramming.pythonViewer.title'
    );
  if (elements.headerTitle)
    elements.headerTitle.textContent = t(
      'visualProgramming.pythonViewer.title'
    );
  if (elements.readOnlyBadge)
    elements.readOnlyBadge.textContent = t(
      'visualProgramming.pythonViewer.readOnly'
    );
  if (elements.closeButton)
    elements.closeButton.textContent = t('common.close');
  if (elements.updateIndicator)
    elements.updateIndicator.textContent = t(
      'visualProgramming.pythonViewer.updated'
    );

  const codeContent = document.getElementById('codeContent');
  if (codeContent?.classList.contains('empty-state')) {
    codeContent.textContent = t('visualProgramming.pythonViewer.emptyState');
  }
}

function initializeLanguage(): void {
  try {
    const savedLanguage = localStorage.getItem('pucklab-language');
    if (
      savedLanguage &&
      translations[savedLanguage as keyof typeof translations]
    ) {
      currentLanguage = savedLanguage;
      document.documentElement.lang = savedLanguage;
    }
  } catch (error) {
    console.error('Failed to load language from localStorage:', error);
  }
  updateTranslations();
}

function watchLanguageChanges(): void {
  setInterval(() => {
    try {
      const savedLanguage = localStorage.getItem('pucklab-language');
      if (
        savedLanguage &&
        savedLanguage !== currentLanguage &&
        translations[savedLanguage as keyof typeof translations]
      ) {
        console.log(
          'Language changed from',
          currentLanguage,
          'to',
          savedLanguage
        );
        currentLanguage = savedLanguage;
        document.documentElement.lang = savedLanguage;
        updateTranslations();
      }
    } catch (error) {
      console.error('Failed to check language changes:', error);
    }
  }, 500);
}

function updateCode(code: string): void {
  const codeContent = document.getElementById('codeContent');
  const updateIndicator = document.getElementById('updateIndicator');

  if (!codeContent) return;

  try {
    if (!code || code.trim() === '') {
      codeContent.textContent = t('visualProgramming.pythonViewer.emptyState');
      codeContent.className = 'empty-state';
    } else {
      codeContent.textContent = code;
      codeContent.className = 'language-python';

      if (Prism?.languages?.python) {
        delete (codeContent as any).dataset.highlighted;
        Prism.highlightElement(codeContent);
      } else {
        console.warn('Prism or Python language not loaded');
      }
    }

    if (updateIndicator) {
      updateIndicator.classList.add('show');
      setTimeout(() => {
        updateIndicator.classList.remove('show');
      }, 1500);
    }
  } catch (error) {
    console.error('Error updating code:', error);
    codeContent.textContent = 'Error displaying code. Please try refreshing.';
    codeContent.className = 'error-state';
  }
}

function closeWindow(): void {
  window.close();
}

(window as any).updateCode = updateCode;
(window as any).closeWindow = closeWindow;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Python code viewer ready');
  console.log('Prism available:', !!Prism);
  console.log('Python language available:', !!Prism?.languages?.python);

  initializeLanguage();

  watchLanguageChanges();

  if (Prism) {
    Prism.manual = true;
  }

  window.addEventListener('codeUpdate', (event: any) => {
    updateCode(event.detail);
  });
});
