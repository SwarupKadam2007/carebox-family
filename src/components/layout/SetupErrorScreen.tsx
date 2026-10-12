import React from 'react';
import { Database, ShieldAlert, Terminal, ExternalLink } from 'lucide-react';

export const SetupErrorScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FCF6EE] flex flex-col items-center justify-center p-6 text-[#1F4E4B]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#2E7D79]/15 shadow-xl text-center">
        {/* Icon & Brand */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100/80 border border-amber-300/40 text-amber-800 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-amber-800" />
        </div>

        <h1 className="font-heading font-bold text-2xl text-[#1F4E4B] mb-2 tracking-tight">
          Configuration Required
        </h1>

        <p className="text-sm text-[#5C716E] mb-6 leading-relaxed">
          CareBox Family is deployed in <strong>Production Mode</strong>, but backend database credentials are missing. To protect medical safety and data integrity, demo mock data is disabled in production.
        </p>

        {/* Required Variables Box */}
        <div className="bg-[#F8F5F0] rounded-2xl p-4 text-left border border-[#2E7D79]/10 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F4E4B] mb-2.5">
            <Terminal className="w-3.5 h-3.5 text-[#2E7D79]" />
            <span>Required Environment Variables</span>
          </div>

          <div className="space-y-2 font-mono text-[11px] text-[#2F5250]">
            <div className="bg-white p-2 rounded-lg border border-black/5 flex items-center justify-between">
              <span>VITE_SUPABASE_URL</span>
              <span className="text-amber-700 font-sans text-[10px] font-medium bg-amber-100 px-1.5 py-0.5 rounded">Missing</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-black/5 flex items-center justify-between">
              <span>VITE_SUPABASE_ANON_KEY</span>
              <span className="text-amber-700 font-sans text-[10px] font-medium bg-amber-100 px-1.5 py-0.5 rounded">Missing</span>
            </div>
          </div>
        </div>

        {/* Steps to resolve */}
        <div className="text-xs text-[#5C716E] text-left space-y-2 mb-6">
          <p className="font-semibold text-[#1F4E4B]">To complete deployment:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create or select your Supabase project.</li>
            <li>Run database migrations from <code className="bg-[#EFE8DD] px-1 py-0.5 rounded text-[11px]">supabase/migrations/</code>.</li>
            <li>Add your Project URL and Anon Key to Vercel environment variables.</li>
            <li>Redeploy your production build.</li>
          </ol>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <a
            href="https://supabase.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#2E7D79] hover:bg-[#246562] text-white font-medium text-xs rounded-xl shadow-sm transition-all"
          >
            <Database className="w-4 h-4" />
            <span>Supabase Documentation</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-[#5C716E]/70">
        CareBox Family • DPDP Act 2023 Compliant Architecture
      </div>
    </div>
  );
};
