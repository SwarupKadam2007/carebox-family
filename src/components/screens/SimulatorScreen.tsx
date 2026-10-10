import React, { useState } from 'react';
import { ArrowLeft, Clock, Volume2, Sparkles, Check, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Slot } from '../../types';

export const SimulatorScreen: React.FC = () => {
  const {
    confirmDose,
    simulatedMinutes,
    setSimulatedMinutes,
    resetDemoDay,
    getSlotStatus,
    reminderSent,
    setCurrentStep,
    showToast,
  } = useApp();

  const [activeCompartment, setActiveCompartment] = useState<Slot>('afternoon');

  // Format simulated minutes into HH:MM AM/PM
  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60) % 24;
    const minutes = mins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const currentSlotStatus = getSlotStatus(activeCompartment);
  const isTaken = currentSlotStatus === 'taken';
  const isLate = currentSlotStatus === 'late';
  const isDue = currentSlotStatus === 'due';
  const hasReminder = reminderSent[activeCompartment];

  const handleBigButtonPress = () => {
    confirmDose(activeCompartment, 'box');
  };

  return (
    <div className="flex flex-col h-full bg-[#FCF6EE] px-5 py-4 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentStep('main')}
          className="p-2 -ml-2 text-[#1F4E4B] hover:text-[#2E7D79] rounded-full transition-colors flex items-center gap-1"
          aria-label="Back to Family App"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-semibold">Back to App</span>
        </button>
        <div className="text-center">
          <span className="text-[10px] font-semibold text-[#8E9E9C] uppercase tracking-wider block">
            Demo Tool
          </span>
          <h1 className="font-heading font-semibold text-sm text-[#1F4E4B]">
            CareBox Hardware Simulator
          </h1>
        </div>
        <div className="w-12" />
      </div>

      {/* Simulator Device Info Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-[#E5EAE9] mb-4 flex items-center justify-between text-xs">
        <div>
          <span className="text-[#8E9E9C] block text-[10px]">DEVICE TOKEN:</span>
          <span className="font-mono font-semibold text-[#1F4E4B]">CB-8842-PUNE</span>
        </div>
        <div className="text-right">
          <span className="text-[#8E9E9C] block text-[10px]">PRETEND TIME (IST):</span>
          <span className="font-semibold text-[#2E7D79] flex items-center justify-end gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(simulatedMinutes)}</span>
          </span>
        </div>
      </div>

      {/* PHYSICAL PILLBOX SIMULATOR CONTAINER */}
      <div className="my-auto bg-[#F4F9F8] rounded-3xl p-5 shadow-card border-2 border-[#2E7D79]/20 flex flex-col items-center">
        {/* Hardware Status Header */}
        <div className="w-full flex items-center justify-between text-[11px] text-[#597573] font-medium mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                hasReminder
                  ? 'bg-[#F2B33D] animate-ping'
                  : 'bg-[#27A348]'
              }`}
            />
            <span>{hasReminder ? 'Reminder chime active' : 'Connected'}</span>
          </div>
          <span className="text-[#8E9E9C]">Battery 96%</span>
        </div>

        {/* 3 Physical Compartments */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {(['morning', 'afternoon', 'night'] as Slot[]).map((slot) => {
            const status = getSlotStatus(slot);
            const slotTaken = status === 'taken';
            const isSelected = activeCompartment === slot;

            return (
              <button
                key={slot}
                onClick={() => setActiveCompartment(slot)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'border-[#2E7D79] bg-white shadow-sm scale-105'
                    : 'border-[#E5EAE9] bg-white/60 hover:bg-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 ${
                    slotTaken
                      ? 'bg-[#EBF7EE] text-[#27A348]'
                      : status === 'late'
                      ? 'bg-[#FEF7EC] text-[#F2B33D] animate-amber-pulse'
                      : status === 'due'
                      ? 'bg-[#FEF7EC] text-[#F2B33D]'
                      : 'bg-gray-100 text-[#8E9E9C]'
                  }`}
                >
                  {slotTaken ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <span className="text-xs font-bold uppercase">{slot.charAt(0)}</span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-[#1F4E4B] capitalize">
                  {slot}
                </span>
                <span
                  className={`text-[9px] font-medium mt-0.5 ${
                    slotTaken ? 'text-[#27A348]' : 'text-[#8E9E9C]'
                  }`}
                >
                  {slotTaken ? 'Taken' : status}
                </span>
              </button>
            );
          })}
        </div>

        {/* Glowing Indicator for the Selected Compartment */}
        <div className="mb-4 text-center">
          <p className="text-xs font-semibold text-[#1F4E4B] capitalize flex items-center justify-center gap-1">
            <span>Compartment: {activeCompartment}</span>
            {hasReminder && (
              <span className="bg-[#FEF7EC] text-[#D89825] px-2 py-0.5 rounded-full text-[10px] border border-[#F2B33D]/30">
                Glow + Chime
              </span>
            )}
          </p>
          <p className="text-[11px] text-[#597573] mt-0.5">
            {isTaken
              ? 'Lid closed. Medicine recorded.'
              : isLate
              ? 'Ring glowing amber. Waiting for button press.'
              : isDue
              ? 'Ring glowing calm teal. Dose is due now.'
              : 'Upcoming dose.'}
          </p>
        </div>

        {/* THE ONE BIG BUTTON */}
        <div className="relative my-2">
          {/* Glowing Ring Effect */}
          <div
            className={`absolute -inset-2.5 rounded-full filter blur-md transition-all duration-300 ${
              isTaken
                ? 'bg-[#27A348]/20'
                : isLate || hasReminder
                ? 'bg-[#F2B33D]/40 animate-pulse'
                : 'bg-[#2E7D79]/20 animate-calm-pulse'
            }`}
          />

          <button
            id="btn-box-one-touch"
            onClick={handleBigButtonPress}
            className={`relative w-28 h-28 rounded-full shadow-float flex flex-col items-center justify-center border-4 transition-all duration-150 active:scale-95 ${
              isTaken
                ? 'bg-[#EBF7EE] border-[#27A348] text-[#27A348]'
                : isLate || hasReminder
                ? 'bg-white border-[#F2B33D] text-[#D89825] hover:bg-[#FEF7EC]'
                : 'bg-white border-[#2E7D79] text-[#2E7D79] hover:bg-[#E8F3F1]'
            }`}
          >
            {isTaken ? (
              <>
                <Check className="w-10 h-10 stroke-[3]" />
                <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">
                  TAKEN
                </span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-[#2E7D79] flex items-center justify-center text-white mb-1">
                  <Volume2 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold tracking-tight text-center leading-tight">
                  PRESS<br />ONE TAP
                </span>
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-[#8E9E9C] mt-3">
          Mom presses this one button when taking medicines.
        </p>
      </div>

      {/* QUICK TIME TRAVEL / TEST SCENARIOS */}
      <div className="mt-4 bg-white rounded-2xl p-4 shadow-card border border-[#E5EAE9]">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold text-[#1F4E4B] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D79]" />
            <span>Time-Travel Scenarios for Demo:</span>
          </h2>
          <button
            onClick={resetDemoDay}
            className="text-[11px] text-[#2E7D79] font-medium flex items-center gap-1 hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              setSimulatedMinutes(8 * 60 + 5); // 8:05 AM
              setActiveCompartment('morning');
              showToast('Time set: 8:05 AM (Morning Taken)');
            }}
            className="p-2.5 rounded-xl border border-[#E5EAE9] hover:border-[#2E7D79] text-left hover:bg-[#F0F7F6]"
          >
            <span className="font-semibold block text-[#1F4E4B]">1. Morning (8:05 AM)</span>
            <span className="text-[10px] text-[#27A348]">Morning Taken ✓</span>
          </button>

          <button
            onClick={() => {
              setSimulatedMinutes(14 * 60 + 5); // 2:05 PM
              setActiveCompartment('afternoon');
              showToast('Time set: 2:05 PM (Afternoon Due)');
            }}
            className="p-2.5 rounded-xl border border-[#E5EAE9] hover:border-[#2E7D79] text-left hover:bg-[#F0F7F6]"
          >
            <span className="font-semibold block text-[#1F4E4B]">2. Afternoon (2:05 PM)</span>
            <span className="text-[10px] text-[#D89825]">Afternoon Due 🕒</span>
          </button>

          <button
            onClick={() => {
              setSimulatedMinutes(15 * 60 + 15); // 3:15 PM (Past 60m delay)
              setActiveCompartment('afternoon');
              showToast('Time set: 3:15 PM (Afternoon Late -> Gentle Nudge eligible!)');
            }}
            className="p-2.5 rounded-xl border border-[#F2B33D] bg-[#FEF7EC]/50 text-left"
          >
            <span className="font-semibold block text-[#D89825]">3. Late (3:15 PM)</span>
            <span className="text-[10px] text-[#D89825]">Enables Gentle Nudge!</span>
          </button>

          <button
            onClick={() => {
              setSimulatedMinutes(21 * 60 + 10); // 9:10 PM
              setActiveCompartment('night');
              showToast('Time set: 9:10 PM (Night Due)');
            }}
            className="p-2.5 rounded-xl border border-[#E5EAE9] hover:border-[#2E7D79] text-left hover:bg-[#F0F7F6]"
          >
            <span className="font-semibold block text-[#1F4E4B]">4. Night (9:10 PM)</span>
            <span className="text-[10px] text-[#8E9E9C]">Night Due 🌙</span>
          </button>
        </div>
      </div>
    </div>
  );
};
