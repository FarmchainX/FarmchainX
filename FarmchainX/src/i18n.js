import i18next from 'i18next';
import enIN from './locales/en-IN.json';
import hiIN from './locales/hi-IN.json';
import teIN from './locales/te-IN.json';
import taIN from './locales/ta-IN.json';
import mlIN from './locales/ml-IN.json';
import knIN from './locales/kn-IN.json';

const resources = {
  'en-IN': { translation: enIN },
  'hi-IN': { translation: hiIN },
  'te-IN': { translation: teIN },
  'ta-IN': { translation: taIN },
  'ml-IN': { translation: mlIN },
  'kn-IN': { translation: knIN },
};

// Get saved language from localStorage or default to English
const savedLanguage = localStorage.getItem('fcx_language') || 'en-IN';

i18next.init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en-IN',
  interpolation: {
    escapeValue: false, // React already handles XSS
  },
});

export default i18next;

