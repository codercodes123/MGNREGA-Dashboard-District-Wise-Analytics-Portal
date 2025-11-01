import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationsEn from './locales/en.json';
import translationsHi from './locales/hi.json';
import translationsMr from './locales/mr.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationsEn },
      hi: { translation: translationsHi },
      mr: { translation: translationsMr }
    },
    lng: 'mr', // Default to Marathi for Maharashtra
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
