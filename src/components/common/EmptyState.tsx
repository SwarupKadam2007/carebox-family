import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white/70 backdrop-blur-sm rounded-2xl border border-[#2E7D79]/10 shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#2E7D79]/10 flex items-center justify-center text-[#2E7D79] mb-3">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="font-heading font-semibold text-base text-[#1F4E4B] mb-1">
        {title}
      </h3>

      <p className="text-xs text-[#5C716E] max-w-xs mb-4 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 bg-[#2E7D79] hover:bg-[#246562] text-white text-xs font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2E7D79]/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
