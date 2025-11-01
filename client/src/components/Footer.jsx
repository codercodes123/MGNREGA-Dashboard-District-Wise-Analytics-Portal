import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, HelpCircle, FileText, Shield, Globe } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">
              {t('footer.aboutTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 leading-relaxed">
              {t('footer.aboutDescription')}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-white">
              {t('footer.government')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a 
                  href="https://nrega.nic.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <Globe className="w-3 h-3" />
                  {t('footer.officialPortal')}
                </a>
              </li>
              <li>
                <a 
                  href="https://india.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <Globe className="w-3 h-3" />
                  {t('footer.indiaPortal')}
                </a>
              </li>
              <li>
                <a 
                  href="/leaderboard" 
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="w-3 h-3" />
                  {t('footer.districtRankings')}
                </a>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">
              {t('footer.helpSupport')}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="inline-flex items-start gap-2">
                <Mail className="w-3 h-3 mt-1 flex-shrink-0" />
                <span>{t('footer.email')}</span>
              </li>
              <li className="inline-flex items-start gap-2">
                <Phone className="w-3 h-3 mt-1 flex-shrink-0" />
                <span>{t('footer.tollFree')}</span>
              </li>
              <li>
                <a 
                  href="/help" 
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <HelpCircle className="w-3 h-3" />
                  {t('footer.faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">
              {t('footer.legalPolicies')}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a 
                  href="#" 
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <Shield className="w-3 h-3" />
                  {t('footer.privacyPolicy')}
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="w-3 h-3" />
                  {t('footer.termsOfUse')}
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <Shield className="w-3 h-3" />
                  {t('footer.disclaimer')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-gray-400">
            <p>
              © {currentYear} {t('footer.copyright')}
            </p>
            <p className="text-center sm:text-right">
              {t('footer.digitalIndia')}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            {t('footer.bestViewed')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
