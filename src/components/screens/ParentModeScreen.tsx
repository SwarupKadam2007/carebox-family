import React, { useState } from 'react';
import { Check, Heart, Shield, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Slot } from '../../types';
import confetti from 'canvas-confetti';

export const ParentModeScreen: React.FC = () => {
  const { parent, getSlotStatus, confirmDose, showToast, medicines } = useApp();
  const [submitting, setSubmitting] = useState(false);

  // Determine currently active or most relevant slot
  const slots: Slot[] = ['morning', 'afternoon', 'night'];
  const dueSlot = slots.find((s) => getSlotStatus(s) === 'due' || getSlotStatus(s) === 'late') ||
                  slots.find((s) => getSlotStatus(s) === 'next') || 'morning';

  const status = getSlotStatus(dueSlot);
  const isTaken = status === 'taken';

  const relevantMeds = medicines.filter(
    (m) => m.slot === dueSlot || m.slot === 'both'
  );

  const slotLabels: Record<Slot, { title: string; time: string; color: string }> = {
    morning: { title: 'Morning Medicine', time: '8:00 AM', color: '#EBF7EE' },
    afternoon: { title: 'Afternoon Medicine', time: '2:00 PM', color: '#FEF7EC' },
    night: { title: 'Night Medicine', time: '9:00 PM', color: '#E8F3F1' },
  };

  const handleTakeDose = async () => {
    if (isTaken || submitting) return;
    setSubmitting(true);

    try {
      confirmDose(dueSlot, 'manual');
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2E7D79', '#27A348', '#F2B33D'],
        });
      } catch {
        // ignore in headless
      }
      showToast(`Well done! ${slotLabels[dueSlot].title} marked as taken.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FCF6EE] px-6 py-8 justify-between text-[#1F4E4B]">
      {/* Top calm header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#2E7D79]/20 text-xs font-medium text-[#2E7D79] mb-2">
          <Heart className="w-3.5 h-3.5 fill-[#2E7D79]" />
          <span>CareBox Parent Mode</span>
        </div>
        <h1 className="text-2xl font-heading font-bold text-[#1F4E4B]">
          Namaste, {parent.name}
        </h1>
        <p className="text-sm text-[#5C716E]">
          {isTaken
            ? 'Your scheduled dose is completed. Rest well!'
            : `Time for your ${dueSlot} tablets.`}
        </p>
      </div>

      {/* Big Dose Card & Giant Action Button */}
      <div className="my-auto flex flex-col items-center">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 border-2 border-[#2E7D79]/20 shadow-lg text-center mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5C716E]">
            Scheduled for {slotLabels[dueSlot].time}
          </span>
          <h2 className="text-xl font-heading font-bold text-[#1F4E4B] mt-1 mb-3">
            {slotLabels[dueSlot].title}
          </h2>

          {/* Medicines preview */}
          {relevantMeds.length > 0 ? (
            <div className="bg-[#FBF9F5] rounded-2xl p-3 text-left space-y-1.5 mb-2">
              <span className="text-[11px] font-bold text-[#5C716E] block mb-1">
                Tablets to take ({relevantMeds.length}):
              </span>
              {relevantMeds.map((m) => (
                <div key={m.id} className="text-xs text-[#1F4E4B] flex justify-between">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-[#5C716E]">{m.dosage || `${m.pillsPerDose} pill`}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5C716E] mb-2">1 prescribed dose</p>
          )}
        </div>

        {/* GIANT "I Took It" Button (Elderly Accessible: 160px diameter) */}
        {isTaken ? (
          <div className="w-44 h-44 rounded-full bg-[#27A348] text-white flex flex-col items-center justify-center shadow-xl border-4 border-white animate-in zoom-in-95">
            <Check className="w-16 h-16 stroke-[3] mb-1" />
            <span className="text-base font-heading font-bold">Taken!</span>
            <span className="text-[11px] opacity-90">Dose recorded</span>
          </div>
        ) : (
          <button
            id="btn-parent-took-it"
            onClick={handleTakeDose}
            disabled={submitting}
            className={`w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white transition-all transform active:scale-95 text-white ${
              status === 'late'
                ? 'bg-[#E59E1A] hover:bg-[#D48F0D] ring-8 ring-[#F2B33D]/30 animate-pulse'
                : 'bg-[#2E7D79] hover:bg-[#246562] ring-8 ring-[#2E7D79]/20'
            }`}
            aria-label="I took my medicine"
          >
            {submitting ? (
              <RefreshCw className="w-10 h-10 animate-spin" />
            ) : (
              <>
                <Check className="w-14 h-14 stroke-[3] mb-1" />
                <span className="text-lg font-heading font-bold">I Took It</span>
                <span className="text-xs opacity-90">Tap once</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Bottom privacy reminder */}
      <div className="text-center space-y-2">
        <p className="text-xs text-[#5C716E] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#2E7D79]" />
          <span>Status shared with your family circle securely</span>
        </p>
        <p className="text-[11px] text-[#8E9E9C]">
          CareBox Family • DPDP Act 2023 Compliant
        </p>
      </div>
    </div>
  );
};
