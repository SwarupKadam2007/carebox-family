import React from 'react';
import { Heart, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { onboardNewFamily } from '../../lib/authService';

export const OnboardingScreen: React.FC = () => {
  const { setCurrentStep, showToast } = useApp();

  return (
    <div className="flex flex-col h-full bg-[#FCF6EE] px-6 py-6 overflow-y-auto justify-between">
      {/* Top Logo & Wordmark */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <img src="/logo.svg" alt="CareBox Logo" className="w-8 h-8" />
        <span className="font-heading font-bold text-xl text-[#2E7D79] tracking-tight">
          CareBox Family
        </span>
      </div>

      {/* Main Illustration */}
      <div className="my-auto py-4 flex flex-col items-center">
        <div className="relative w-full max-w-[320px] aspect-[4/3] rounded-3xl overflow-hidden shadow-card border border-[#2E7D79]/10 bg-white p-1">
          <img
            src="/images/onboarding_family.jpg"
            alt="Family gathered peacefully with Mom around the CareBox"
            className="w-full h-full object-cover rounded-[22px]"
          />
        </div>

        {/* Headings */}
        <div className="text-center mt-6 space-y-2">
          <h1 className="font-heading font-bold text-2xl text-[#1F4E4B] leading-tight">
            Peace of mind,<br />without the nagging
          </h1>
          <p className="text-[#597573] text-[15px] max-w-[280px] mx-auto leading-relaxed">
            See that Mom&apos;s medicines are taken, without calling.
          </p>
        </div>

        {/* Pagination Dots (3 dots, 1st active) */}
        <div className="flex items-center justify-center gap-2 mt-6" aria-hidden="true">
          <div className="w-5 h-2 rounded-full bg-[#2E7D79]" />
          <div className="w-2 h-2 rounded-full bg-[#C3CDCC]" />
          <div className="w-2 h-2 rounded-full bg-[#C3CDCC]" />
        </div>
      </div>

      {/* Role Selection Actions matching Phase 2 */}
      <div className="space-y-2.5 pb-2 pt-2">
        <button
          id="btn-role-parent"
          onClick={async () => {
            await onboardNewFamily('My Family', 'Myself', 'parent');
            setCurrentStep('connect-box');
            showToast('Role set: Parent (Device Owner). Let’s pair your CareBox.');
          }}
          className="w-full py-3.5 bg-[#2E7D79] hover:bg-[#246562] active:scale-[0.99] text-white font-medium text-sm rounded-2xl shadow-soft transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4 fill-white" />
          <span>I take medicines (Parent Mode)</span>
        </button>

        <button
          id="btn-role-caregiver"
          onClick={async () => {
            await onboardNewFamily('Family Circle', 'Mom', 'admin');
            setCurrentStep('connect-box');
            showToast('Role set: Family Caregiver. Let’s connect to Mom’s box.');
          }}
          className="w-full py-3.5 bg-white border border-[#2E7D79] text-[#2E7D79] hover:bg-[#E8F3F1]/50 active:scale-[0.99] font-medium text-sm rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span>I care for someone (Caregiver)</span>
        </button>

        <p className="text-center text-[11px] text-[#8E9E9C] flex items-center justify-center gap-1.5 pt-1">
          <span>🔒 Privacy first</span>
          <span>•</span>
          <span>No cameras</span>
          <span>•</span>
          <span>Status only</span>
        </p>
      </div>
    </div>
  );
};
