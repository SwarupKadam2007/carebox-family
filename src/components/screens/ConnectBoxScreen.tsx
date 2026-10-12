import React, { useState } from 'react';
import { ArrowLeft, Check, Camera, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sanitizeText } from '../../lib/security';

export const ConnectBoxScreen: React.FC = () => {
  const { setCurrentStep, setCurrentTab, parent, setParent, showToast } = useApp();
  const [parentName, setParentName] = useState(parent.relationName || 'Mom');
  const [isEditingName, setIsEditingName] = useState(false);
  const [step] = useState<number>(2); // 1 = scan, 2 = details, 3 = done

  const handleContinue = () => {
    const cleanName = sanitizeText(parentName, 40) || 'Mom';
    setParent((prev) => ({
      ...prev,
      relationName: cleanName,
      boxConnected: true,
    }));
    showToast(`CareBox connected for ${cleanName}!`);
    setCurrentStep('main');
    setCurrentTab('today');
  };

  return (
    <div className="flex flex-col h-full bg-[#FCF6EE] px-5 py-4 overflow-y-auto justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentStep('welcome')}
            className="p-2 -ml-2 text-[#1F4E4B] hover:text-[#2E7D79] rounded-full transition-colors"
            aria-label="Back to welcome"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-heading font-semibold text-base text-[#1F4E4B]">
            Connect the Box
          </h2>
          <div className="w-7" /> {/* Balance spacer */}
        </div>

        {/* 3-Step Stepper */}
        <div className="flex items-center justify-between px-2 mb-6" aria-label="Setup steps">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-[#2E7D79] text-white flex items-center justify-center text-xs font-semibold">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-[11px] font-medium text-[#2E7D79] mt-1">Scan QR</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-[#2E7D79]" />

          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full ${step >= 2 ? 'bg-[#2E7D79] text-white' : 'bg-[#C3CDCC] text-white'} flex items-center justify-center text-xs font-semibold`}>
              2
            </div>
            <span className="text-[11px] font-medium text-[#2E7D79] mt-1">Add details</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-[#E5EAE9]" />

          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-[#E5EAE9] text-[#8E9E9C] flex items-center justify-center text-xs font-semibold">
              3
            </div>
            <span className="text-[11px] font-medium text-[#8E9E9C] mt-1">Done</span>
          </div>
        </div>

        {/* Scan Section Heading */}
        <div className="mb-4">
          <h1 className="font-heading font-semibold text-lg text-[#1F4E4B]">
            Scan the QR code<br />on the CareBox
          </h1>
          <p className="text-xs text-[#597573] mt-1">
            Open the pillbox lid and scan the QR code inside the box.
          </p>
        </div>

        {/* QR Code Viewfinder Card */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#2E7D79]/20 shadow-sm bg-white mb-4">
          <img
            src="/images/carebox_qr_scan.jpg"
            alt="CareBox inside with QR code"
            className="w-full h-40 object-cover"
          />
          {/* Subtle scanning crosshairs */}
          <div className="absolute inset-4 border-2 border-[#2E7D79] rounded-xl pointer-events-none opacity-80" />
        </div>

        {/* Success Connected Banner */}
        <div className="bg-[#EBF7EE] border border-[#27A348]/20 rounded-xl p-3.5 flex items-start gap-3 mb-5">
          <div className="w-6 h-6 rounded-full bg-[#27A348] text-white flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E8238]">
              CareBox connected!
            </p>
            <p className="text-xs text-[#2E7D79]/80 mt-0.5">
              Now let&apos;s add your parent&apos;s details.
            </p>
          </div>
        </div>

        {/* Parent Details Form */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-[#E5EAE9] flex items-center gap-4">
          {/* Avatar with edit option */}
          <div className="relative shrink-0">
            <img
              src={parent.photoUrl}
              alt={parent.relationName}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#2E7D79]/30"
            />
            <button
              onClick={() => showToast('Photo uploaded successfully.')}
              className="absolute -bottom-1 -right-1 bg-[#2E7D79] text-white p-1 rounded-full shadow-sm hover:bg-[#246562]"
              aria-label="Add or change parent photo"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          {/* Name Field */}
          <div className="flex-1">
            <label htmlFor="parent-name-input" className="block text-[11px] font-medium text-[#8E9E9C] uppercase tracking-wider mb-0.5">
              Parent&apos;s name
            </label>
            <div className="flex items-center justify-between">
              {isEditingName ? (
                <input
                  id="parent-name-input"
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  autoFocus
                  className="font-heading font-semibold text-base text-[#1F4E4B] border-b border-[#2E7D79] outline-none w-full py-0.5"
                />
              ) : (
                <span className="font-heading font-semibold text-base text-[#1F4E4B]">
                  {parentName}
                </span>
              )}
              <button
                onClick={() => setIsEditingName(!isEditingName)}
                className="p-1.5 text-[#597573] hover:text-[#2E7D79] rounded-lg"
                aria-label="Edit parent name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => showToast('Photo saved.')}
              className="text-[11px] font-medium text-[#2E7D79] flex items-center gap-1 mt-1 hover:underline"
            >
              <Camera className="w-3 h-3" />
              <span>Add photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Continue Button */}
      <div className="pt-4 pb-2">
        <button
          id="btn-connect-continue"
          onClick={handleContinue}
          className="w-full py-4 bg-[#2E7D79] hover:bg-[#246562] active:scale-[0.99] text-white font-medium text-base rounded-2xl shadow-soft transition-all duration-200"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
