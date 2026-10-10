import React from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LegalModals: React.FC = () => {
  const { subView, setSubView } = useApp();

  if (!subView) return null;

  const renderContent = () => {
    switch (subView) {
      case 'terms':
        return (
          <div className="space-y-4 text-xs text-[#597573] leading-relaxed">
            <div className="bg-[#FEF7EC] border border-[#F2B33D]/30 p-3 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D89825] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#D89825] font-medium">
                IMPORTANT: CareBox is NOT a medical device, does not provide medical advice, and cannot be used for emergencies. In India, call 112 for medical emergencies.
              </p>
            </div>

            <section>
              <h3 className="font-semibold text-sm text-[#1F4E4B] mb-1">1. Eligibility &amp; Purpose</h3>
              <p>
                CareBox Family is intended for adults (18+) to coordinate calm, respectful medication confirmation between family members. It acts purely as a factual reminder logging companion.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-sm text-[#1F4E4B] mb-1">2. Family Sharing &amp; Parent Dignity</h3>
              <p>
                The elderly parent retains full dignity and control. The parent can pause sharing at any time, immediately withholding status updates from family members.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-sm text-[#1F4E4B] mb-1">3. Best-Effort Notifications</h3>
              <p>
                Notifications and reminders are delivered on a best-effort basis depending on internet connectivity and device availability. CareBox cannot guarantee 100% receipt.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-sm text-[#1F4E4B] mb-1">4. Governing Law</h3>
              <p>
                These terms are governed by the laws of India.
              </p>
            </section>
          </div>
        );

      case 'privacy-policy':
        return (
          <div className="space-y-4 text-xs text-[#597573] leading-relaxed">
            <div className="bg-[#EBF7EE] border border-[#27A348]/20 p-3 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#27A348] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#1E8238] font-medium">
                Aligned with India&apos;s Digital Personal Data Protection (DPDP) Act 2023. Privacy by design, zero surveillance.
              </p>
            </div>

            <section>
              <h3 className="font-semibold text-sm text-[#1F4E4B] mb-1">1. Strict Data Minimisation</h3>
              <p>
                We collect ONLY account email, medicine names entered by you, and button-press timestamps. We NEVER collect GPS location, camera feeds, microphone data, or phone contacts.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-sm text-[#1F4E4B] mb-1">2. Sensitive Health Data Handling</h3>
              <p>
                Medication names are stored with end-to-end encryption and strict Row Level Security. Data is never shared with third parties, advertisers, or insurance providers.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-sm text-[#1F4E4B] mb-1">3. Right to Data Portability &amp; Erasure</h3>
              <p>
                You can export your complete data in standard JSON format or permanently delete all family and medication records with one tap.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-sm text-[#1F4E4B] mb-1">4. Data Protection Officer</h3>
              <p>
                Grievance Officer: Swarup Kadam (privacy@carebox.family), Maharashtra, India.
              </p>
            </section>
          </div>
        );

      case 'schedules':
        return (
          <div className="space-y-4 text-xs text-[#597573]">
            <p>Configure default dose times and reminder tolerances.</p>
            <div className="space-y-2.5">
              <div className="p-3 bg-white rounded-xl border border-[#E5EAE9] flex justify-between items-center">
                <span className="font-medium text-[#1F4E4B]">Morning Slot</span>
                <span className="font-mono text-xs font-semibold text-[#2E7D79]">08:00 AM</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E5EAE9] flex justify-between items-center">
                <span className="font-medium text-[#1F4E4B]">Afternoon Slot</span>
                <span className="font-mono text-xs font-semibold text-[#2E7D79]">02:00 PM</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E5EAE9] flex justify-between items-center">
                <span className="font-medium text-[#1F4E4B]">Night Slot</span>
                <span className="font-mono text-xs font-semibold text-[#2E7D79]">09:00 PM</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E5EAE9] flex justify-between items-center">
                <span className="font-medium text-[#1F4E4B]">Gentle Nudge Delay</span>
                <span className="font-mono text-xs font-semibold text-[#F2B33D]">60 minutes</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (subView) {
      case 'terms':
        return 'Terms of Service';
      case 'privacy-policy':
        return 'Privacy Policy';
      case 'schedules':
        return 'Dose Schedules';
      default:
        return 'Information';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setSubView(null)}
    >
      <div
        className="bg-white w-full max-w-md max-h-[85vh] rounded-3xl p-5 shadow-float border border-[#E5EAE9] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F4F3] mb-4">
          <button
            onClick={() => setSubView(null)}
            className="p-1.5 -ml-1.5 text-[#1F4E4B] hover:text-[#2E7D79] rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-heading font-semibold text-base text-[#1F4E4B]">
            {getTitle()}
          </h2>
          <div className="w-7" />
        </div>

        <div className="overflow-y-auto pr-1 flex-1">
          {renderContent()}
        </div>

        <button
          onClick={() => setSubView(null)}
          className="mt-4 w-full py-3 bg-[#2E7D79] text-white font-medium text-xs rounded-xl hover:bg-[#246562]"
        >
          Close
        </button>
      </div>
    </div>
  );
};
