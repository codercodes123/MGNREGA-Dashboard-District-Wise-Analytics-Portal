import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <img 
                src="/mgnrega-logo.jpg" 
                alt="MGNREGA Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight">
                {t('app.title')}
              </h1>
              <p className="text-xs text-gray-600">{t('app.subtitle')}</p>
            </div>
            {/* Mobile: Show abbreviated title */}
            <div className="block sm:hidden">
              <h1 className="text-sm font-bold text-gray-900">
                {t('app.titleShort', 'मनरेगा')}
              </h1>
            </div>
          </Link>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;
