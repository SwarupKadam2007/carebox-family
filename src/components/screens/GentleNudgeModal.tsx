import React from 'react';
import { Bell, X, PhoneCall, HeartHandshake } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GentleNudgeModal: React.FC = () => {
  const {
    nudgeModalOpen,
    setNudgeModalOpen,
    activeNudgeSlot,
    parent,
    sendGentleNudge,
    logCallWithParent,
  } = useApp();

  if (!nudgeModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nudge-modal-title"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn"
      onClick={() => setNudgeModalOpen(false)}
    >
      {/* Top Lock-screen / Push Notification Simulation Preview */}
      <div
        className="w-full max-w-sm mx-auto px-4 pt-10 mb-auto pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-float border border-white/40 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2E7D79] flex items-center justify-center shrink-0 shadow-sm">
            <img src="/logo.svg" alt="CareBox" className="w-5 h-5 invert" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-[#597573] font-medium">
              <span>CareBox Family</span>
              <span>9:47 AM</span>
            </div>
            <p className="text-xs font-semibold text-[#1F4E4B] mt-0.5">
              {parent.relationName} hasn&apos;t confirmed her {activeNudgeSlot} medicine yet.
            </p>
            <p className="text-[11px] text-[#597573] mt-0.5">A gentle reminder?</p>
          </div>
        </div>
      </div>

      {/* Main Bottom Sheet matching Screen 4 */}
      <div
        className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 shadow-float border-t border-[#E5EAE9] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setNudgeModalOpen(false)}
          className="absolute top-5 right-5 p-2 text-[#8E9E9C] hover:text-[#1F4E4B] rounded-full transition-colors"
          aria-label="Close reminder dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Amber Bell Icon */}
        <div className="flex justify-center mb-4 pt-1">
          <div className="w-14 h-14 rounded-full bg-[#FEF7EC] border border-[#F2B33D]/30 flex items-center justify-center shadow-sm">
            <Bell className="w-7 h-7 text-[#F2B33D] fill-[#F2B33D]" />
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center mb-6 px-2">
          <h2
            id="nudge-modal-title"
            className="font-heading font-bold text-lg text-[#1F4E4B] leading-snug"
          >
            {parent.relationName} hasn&apos;t confirmed her<br />
            {activeNudgeSlot} medicine yet.
          </h2>
          <p className="text-sm text-[#597573] mt-2">
            Send a gentle reminder?
          </p>
        </div>

        {/* Buttons matching Screen 4 */}
        <div className="space-y-3 pb-2">
          <button
            id="btn-send-nudge"
            onClick={() => sendGentleNudge(activeNudgeSlot)}
            className="w-full py-3.5 bg-[#2E7D79] hover:bg-[#246562] active:scale-[0.99] text-white font-medium text-base rounded-2xl shadow-soft flex items-center justify-center gap-2 transition-all duration-200"
          >
            <HeartHandshake className="w-5 h-5" />
            <span>Send a kind reminder</span>
          </button>

          <button
            id="btn-call-parent"
            onClick={() => logCallWithParent(activeNudgeSlot)}
            className="w-full py-3.5 bg-white border border-[#2E7D79] text-[#2E7D79] hover:bg-[#E8F3F1]/50 active:scale-[0.99] font-medium text-base rounded-2xl flex items-center justify-center gap-2 transition-all duration-200"
          >
            <PhoneCall className="w-4 h-4" />
            <span>I&apos;ll call her</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-[#8E9E9C] pt-2">
          Only sent once. The pillbox will softly glow and chime.
        </p>
      </div>
    </div>
  );
};
