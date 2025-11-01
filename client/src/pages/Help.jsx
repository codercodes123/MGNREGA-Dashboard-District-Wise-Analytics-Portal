import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle,
  Users,
  Home,
  Calendar,
  DollarSign,
  Info,
  MapPin,
  BarChart3
} from 'lucide-react';

const Help = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: MapPin,
      title: t('help.step1'),
      description: 'Choose your state from the dropdown, then select your district'
    },
    {
      icon: BarChart3,
      title: t('help.step2'),
      description: 'See employment data, work completion, and expenditure details'
    },
    {
      icon: Calendar,
      title: t('help.step3'),
      description: 'View trends over time to understand performance changes'
    },
    {
      icon: Users,
      title: t('help.step4'),
      description: 'Use the share button to spread awareness in your community'
    }
  ];

  const metrics = [
    {
      icon: Users,
      title: t('metrics.employment'),
      description: t('help.employmentHelp')
    },
    {
      icon: Home,
      title: t('metrics.households'),
      description: t('help.householdsHelp')
    },
    {
      icon: Calendar,
      title: t('metrics.personDays'),
      description: t('help.personDaysHelp')
    },
    {
      icon: DollarSign,
      title: t('metrics.expenditure'),
      description: t('help.expenditureHelp')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('help.title')}
            </h1>
            <p className="text-gray-600">
              Learn how to use the MGNREGA Performance Tracker
            </p>
          </div>

          {/* How to Use */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Getting Started
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="card">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Understanding Metrics */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {t('help.metricsHelp')}
            </h2>
            <div className="space-y-4">
              {metrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div key={index} className="card">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-success-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {metric.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* About MGNREGA */}
          <div className="card bg-primary-50 border-2 border-primary-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Info className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('faq.aboutTitle')}
                </h3>
                <p className="text-sm text-gray-700">
                  {t('faq.aboutDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {t('faq.title')}
            </h2>
            <div className="space-y-4">
              <details className="card group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{t('faq.q1')}</span>
                  <span className="text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">
                  {t('faq.a1')}
                </p>
              </details>

              <details className="card group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{t('faq.q2')}</span>
                  <span className="text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">
                  {t('faq.a2')}
                </p>
              </details>

              <details className="card group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{t('faq.q3')}</span>
                  <span className="text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">
                  {t('faq.a3')}
                </p>
              </details>

              <details className="card group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{t('faq.q4')}</span>
                  <span className="text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">
                  {t('faq.a4')}
                </p>
              </details>

              <details className="card group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{t('faq.q5')}</span>
                  <span className="text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">
                  {t('faq.a5')}
                </p>
              </details>

              <details className="card group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{t('faq.q6')}</span>
                  <span className="text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">
                  {t('faq.a6')}
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
