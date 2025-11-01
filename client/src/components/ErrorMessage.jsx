import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ErrorMessage = ({ message, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-primary-50 rounded-full p-4 mb-4">
        <AlertCircle className="w-12 h-12 text-primary-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t('common.error')}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message || t('errors.fetchError')}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.retry')}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
