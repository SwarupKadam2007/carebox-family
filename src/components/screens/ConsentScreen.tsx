/**
 * ConsentScreen — DPDP Act 2023 compliant consent collection.
 * Three checkboxes: Terms of Service, Privacy Policy, Medicine Data Processing.
 * User must accept all three before proceeding. Records consent to Supabase.
 */
import React, { useState } from 'react';
import { Shield, FileText, Pill, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { recordConsent } from '../../lib/authService';
import { IS_SUPABASE_CONFIGURED } from '../../lib/supabase';

const CONSENT_VERSION = '2025-10';

const ConsentScreen: React.FC = () => {
  const { user, setAuthStep, setConsentsAccepted } = useAuth();

  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [medicineData, setMedicineData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAccepted = terms && privacy && medicineData;

  const handleProceed = async () => {
    if (!allAccepted) return;
    setIsSubmitting(true);
    setError(null);

    if (IS_SUPABASE_CONFIGURED && user) {
      const results = await Promise.all([
        recordConsent(user.id, 'terms', CONSENT_VERSION),
        recordConsent(user.id, 'privacy', CONSENT_VERSION),
        recordConsent(user.id, 'medicine_data', CONSENT_VERSION),
      ]);

      const failed = results.find((r) => r.error !== null);
      if (failed) {
        setError('Failed to save consent. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    setConsentsAccepted({ terms: true, privacy: true, medicineData: true });
    setAuthStep('ready');
  };

  const ConsentItem: React.FC<{
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    linkText: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }> = ({ id, icon, title, description, linkText, checked, onChange }) => (
    <label
      htmlFor={id}
      className={`flex gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        checked
          ? 'border-teal-400 bg-teal-50'
          : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
      }`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        checked ? 'bg-teal-100' : 'bg-slate-100'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm font-poppins">{title}</p>
        <p className="text-slate-500 text-xs mt-0.5 font-inter leading-relaxed">{description}</p>
        <button
          type="button"
          className="text-teal-600 text-xs font-inter font-medium mt-1 flex items-center gap-0.5 hover:underline"
          onClick={(e) => { e.preventDefault(); /* open modal */ }}
        >
          {linkText} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-shrink-0 mt-1">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          checked ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white'
        }`}>
          {checked && <CheckCircle2 className="w-4 h-4 text-white fill-white" />}
        </div>
      </div>
    </label>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-700 to-teal-600 px-6 pt-16 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Shield className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-2xl font-bold text-white font-poppins">Privacy First</h1>
          <p className="text-teal-200 text-sm mt-2 font-inter max-w-xs mx-auto">
            CareBox is built on consent. Please review and agree to each item below
            before continuing.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full space-y-3">
        <p className="text-xs text-slate-500 font-inter text-center mb-4">
          Compliant with India's DPDP Act 2023 · All data stays in your family's control.
        </p>

        <ConsentItem
          id="consent-terms"
          icon={<FileText className="w-5 h-5 text-teal-600" />}
          title="Terms of Service"
          description="How we handle your account, usage rules, and what CareBox promises to you."
          linkText="Read Terms"
          checked={terms}
          onChange={setTerms}
        />

        <ConsentItem
          id="consent-privacy"
          icon={<Shield className="w-5 h-5 text-teal-600" />}
          title="Privacy Policy"
          description="We collect only dose status. No location, no camera, no live feed. Parent can pause sharing at any time."
          linkText="Read Privacy Policy"
          checked={privacy}
          onChange={setPrivacy}
        />

        <ConsentItem
          id="consent-medicine"
          icon={<Pill className="w-5 h-5 text-teal-600" />}
          title="Medicine Data Processing"
          description="Medicine names and dose times are stored securely to show calm status to family members."
          linkText="Learn More"
          checked={medicineData}
          onChange={setMedicineData}
        />

        {error && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-inter">
            {error}
          </div>
        )}

        {/* Select All shortcut */}
        {!allAccepted && (
          <button
            onClick={() => { setTerms(true); setPrivacy(true); setMedicineData(true); }}
            className="w-full py-2.5 text-teal-600 text-sm font-inter font-medium hover:bg-teal-50 rounded-2xl transition-all"
          >
            ✓ Accept all three
          </button>
        )}

        <button
          onClick={handleProceed}
          disabled={!allAccepted || isSubmitting}
          className={`w-full py-4 rounded-2xl font-bold text-base font-poppins shadow-lg transition-all ${
            allAccepted && !isSubmitting
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:scale-[1.02] hover:shadow-xl'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Saving…' : 'Continue to CareBox →'}
        </button>

        <p className="text-center text-xs text-slate-400 font-inter pt-2 pb-6">
          You can withdraw consent at any time from Settings → Privacy.
        </p>
      </div>
    </div>
  );
};

export default ConsentScreen;
