import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('fcx_language', lng);
    window.dispatchEvent(new Event('fcx:language-changed'));
  };

  return { t, i18n, changeLanguage };
};

