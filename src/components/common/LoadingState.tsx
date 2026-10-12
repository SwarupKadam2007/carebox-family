import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading updates...',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 text-[#5C716E] ${className}`}
    >
      <Loader2 className="w-7 h-7 text-[#2E7D79] animate-spin mb-3" />
      <p className="text-sm font-medium tracking-tight">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
};
