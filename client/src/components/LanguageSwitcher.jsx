import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

/**
 * Language Switcher Component - English | हिन्दी | मराठी
 * Full language names for better accessibility
 */
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const languages = [
    { code: 'en', label: 'English', name: 'English' },
    { code: 'hi', label: 'हिन्दी', name: 'Hindi' },
    { code: 'mr', label: 'मराठी', name: 'Marathi' }
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Globe Icon */}
      <Globe className="w-5 h-5 text-gray-600 hidden sm:block" />
      
      {/* Language Toggle Buttons */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all
              ${currentLang === lang.code
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-transparent text-gray-700 hover:bg-gray-200'
              }
            `}
            title={lang.name}
            aria-label={`Switch to ${lang.name}`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
