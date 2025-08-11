import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

// Import the Python code viewer specific CSS
import './pythonCodeViewer.css';

// Import translation files
import enTranslations from '../presentation/i18n/locales/en.json';
import frTranslations from '../presentation/i18n/locales/fr.json';
import deTranslations from '../presentation/i18n/locales/de.json';
import nlTranslations from '../presentation/i18n/locales/nl.json';

const translations = {
  en: enTranslations,
  fr: frTranslations,
  de: deTranslations,
  nl: nlTranslations,
};

let currentLanguage = 'en';

// Get translation using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function t(key: string, fallback: string = key): string {
  const currentTranslations =
    translations[currentLanguage as keyof typeof translations];
  const translation = getNestedValue(currentTranslations, key);

  if (translation) return translation;

  // Fallback to English
  const englishTranslation = getNestedValue(translations.en, key);
  return englishTranslation || fallback;
}

// Update UI with translations
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

  // Update empty state if currently showing
  const codeContent = document.getElementById('codeContent');
  if (codeContent?.classList.contains('empty-state')) {
    codeContent.textContent = t('visualProgramming.pythonViewer.emptyState');
  }
}

// Initialize language from localStorage
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

// Listen for language changes in localStorage
function watchLanguageChanges(): void {
  // Poll localStorage for language changes every 500ms
  // This is needed because storage events don't fire in the same window that made the change
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

// Update code with syntax highlighting
function updateCode(code: string): void {
  const codeContent = document.getElementById('codeContent');
  const updateIndicator = document.getElementById('updateIndicator');

  if (!codeContent) return;

  try {
    if (!code || code.trim() === '') {
      codeContent.textContent = t('visualProgramming.pythonViewer.emptyState');
      codeContent.className = 'empty-state';
    } else {
      // Set the code content
      codeContent.textContent = code;
      codeContent.className = 'language-python';

      // Apply Prism.js highlighting
      if (Prism?.languages?.python) {
        // Force re-highlighting
        delete (codeContent as any).dataset.highlighted;
        Prism.highlightElement(codeContent);
      } else {
        console.warn('Prism or Python language not loaded');
      }
    }

    // Show update indicator briefly
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

// Close window function
function closeWindow(): void {
  window.close();
}

// Make functions available globally
(window as any).updateCode = updateCode;
(window as any).closeWindow = closeWindow;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Python code viewer ready');
  console.log('Prism available:', !!Prism);
  console.log('Python language available:', !!Prism?.languages?.python);

  // Initialize language and translations
  initializeLanguage();

  // Start watching for language changes
  watchLanguageChanges();

  // Force Prism manual mode for better control
  if (Prism) {
    Prism.manual = true;
  }

  // Listen for code updates from the main process
  window.addEventListener('codeUpdate', (event: any) => {
    updateCode(event.detail);
  });
});
