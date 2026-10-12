import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-6 text-center bg-amber-50/80 border border-amber-200/60 rounded-2xl ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-2">
        <AlertCircle className="w-5 h-5" />
      </div>

      <h4 className="font-heading font-semibold text-sm text-[#1F4E4B] mb-1">
        {title}
      </h4>

      <p className="text-xs text-[#5C716E] max-w-xs mb-3 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#2E7D79]/20 hover:bg-[#2E7D79]/5 text-[#1F4E4B] text-xs font-medium rounded-lg shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#2E7D79]" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
