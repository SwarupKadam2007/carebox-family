import React from 'react';
import { AlertCircle, Database } from 'lucide-react';

export const DemoModeBanner: React.FC = () => {
  return (
    <div
      role="banner"
      className="w-full bg-[#FFF7E8] border-b border-[#F2B33D]/40 text-[#6B4B0A] px-3 py-1.5 text-[11px] flex items-center justify-between gap-2 shadow-2xs z-30"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <AlertCircle className="w-3.5 h-3.5 text-[#B87A00] shrink-0" />
        <span className="font-semibold text-[#8F5E00] uppercase tracking-wider text-[9px] bg-[#FDE6B8] px-1.5 py-0.5 rounded">
          Demo Mode
        </span>
        <span className="truncate text-[#5C420D]">
          Using simulated local data — connect Supabase for live multi-user sync
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1 text-[10px] text-[#8F5E00] font-medium hidden sm:inline-flex">
          <Database className="w-3 h-3 text-[#B87A00]" />
          <span>Offline DB</span>
        </span>
      </div>
    </div>
  );
};
