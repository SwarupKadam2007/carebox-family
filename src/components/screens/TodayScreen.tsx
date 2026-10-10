import React from 'react';
import { Sun, Sunset, Moon, Check, EyeOff, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Slot } from '../../types';

export const TodayScreen: React.FC = () => {
  const {
    parent,
    doseEvents,
    getSlotStatus,
    confirmDose,
    setNudgeModalOpen,
    reminderSent,
    callLogged,
    setCurrentStep,
  } = useApp();

  const morningStatus = getSlotStatus('morning');
  const afternoonStatus = getSlotStatus('afternoon');
  const nightStatus = getSlotStatus('night');

  const morningEvent = doseEvents.find((e) => e.slot === 'morning');
  const afternoonEvent = doseEvents.find((e) => e.slot === 'afternoon');
  const nightEvent = doseEvents.find((e) => e.slot === 'night');

  // Greeting based on time of day
  const getGreeting = () => {
    return 'Good morning,';
  };

  // Status summary line
  const isAnyLate = afternoonStatus === 'late' || morningStatus === 'late';
  const isAllTaken = morningStatus === 'taken' && afternoonStatus === 'taken' && nightStatus === 'taken';

  const renderSlotCard = (
    slot: Slot,
    title: string,
    defaultTime: string,
    icon: React.ReactNode,
    status: ReturnType<typeof getSlotStatus>,
    event: typeof morningEvent,
    iconBgColor: string
  ) => {
    const isTaken = status === 'taken';
    const isLate = status === 'late';
    const isDue = status === 'due';

    return (
      <div
        key={slot}
        id={`card-dose-${slot}`}
        onClick={() => {
          if (isLate) {
            setNudgeModalOpen(true);
          } else if (!isTaken) {
            confirmDose(slot, 'manual');
          }
        }}
        className={`bg-white rounded-2xl p-4 shadow-card border transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.99] ${
          isLate
            ? 'border-[#F2B33D] bg-[#FEF7EC]/30'
            : isTaken
            ? 'border-[#27A348]/20'
            : 'border-[#E5EAE9]'
        }`}
      >
        <div className="flex items-center gap-3.5">
          {/* Slot Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}
          >
            {icon}
          </div>

          <div>
            <h3 className="font-heading font-semibold text-base text-[#1F4E4B]">
              {title}
            </h3>
            <p className="text-xs text-[#597573] mt-0.5">
              {isTaken ? (
                <span className="text-[#27A348] font-medium">
                  Taken {event?.takenAt || defaultTime}
                </span>
              ) : isLate ? (
                <span className="text-[#D89825] font-semibold flex items-center gap-1">
                  <span>Due {defaultTime}</span>
                  <span className="text-[10px] bg-[#FEF7EC] text-[#D89825] px-1.5 py-0.5 rounded-full border border-[#F2B33D]/40">
                    Late
                  </span>
                </span>
              ) : isDue ? (
                <span className="text-[#D89825] font-medium">Due {defaultTime}</span>
              ) : (
                <span className="text-[#8E9E9C]">Due {defaultTime}</span>
              )}
            </p>
          </div>
        </div>

        {/* Status Badge / Checkmark matching the approved UI layout */}
        <div className="flex items-center gap-2">
          {isLate && !reminderSent[slot] && !callLogged[slot] && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNudgeModalOpen(true);
              }}
              className="px-2.5 py-1 text-[11px] font-medium bg-[#FEF7EC] text-[#D89825] border border-[#F2B33D] rounded-full flex items-center gap-1 hover:bg-[#F2B33D]/10"
              aria-label="Send gentle nudge"
            >
              <Bell className="w-3 h-3" />
              <span>Nudge</span>
            </button>
          )}

          {isTaken ? (
            <div
              className="w-7 h-7 rounded-full bg-[#27A348] text-white flex items-center justify-center shadow-sm"
              aria-label={`${title} dose taken`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          ) : isDue || isLate ? (
            <div
              className="w-7 h-7 rounded-full border-2 border-[#F2B33D] flex items-center justify-center bg-white"
              aria-label={`${title} dose due or late`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#F2B33D]/40" />
            </div>
          ) : (
            <div
              className="w-7 h-7 rounded-full border-2 border-[#C3CDCC] flex items-center justify-center bg-white"
              aria-label={`${title} dose later`}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FCF6EE] px-5 py-4 overflow-y-auto">
      {/* Top Greeting Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-[#597573] font-medium">{getGreeting()}</span>
          <h1 className="font-heading font-bold text-lg text-[#1F4E4B]">
            {parent.relationName}&apos;s medicines today
          </h1>
        </div>

        <button
          onClick={() => setCurrentStep('simulator')}
          className="relative group"
          title="Open CareBox Device Simulator"
          aria-label="Open CareBox Simulator"
        >
          <img
            src={parent.photoUrl}
            alt={parent.relationName}
            className="w-11 h-11 rounded-full object-cover border-2 border-[#2E7D79]/40 shadow-sm transition-transform group-hover:scale-105"
          />
          {parent.boxConnected && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#27A348] border-2 border-white rounded-full"
              title="Box online"
            />
          )}
        </button>
      </div>

      {/* Sharing Paused Alert if Parent Paused Sharing */}
      {parent.sharingPaused ? (
        <div className="bg-[#FEF7EC] border border-[#F2B33D]/30 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-[#D89825] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[#D89825]">
              Sharing paused by {parent.relationName}
            </h2>
            <p className="text-xs text-[#597573] mt-0.5">
              {parent.relationName} has paused live sharing. Dignity & privacy are respected.
            </p>
          </div>
        </div>
      ) : (
        /* Summary Banner matching screen 3 */
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-[#27A348] text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-sm font-semibold text-[#1F4E4B]">
            {isAllTaken
              ? 'All medicines confirmed for today'
              : isAnyLate
              ? 'Afternoon medicine due for confirmation'
              : 'All good so far'}
          </span>
        </div>
      )}

      {/* 3 Dose Cards matching screen 3 */}
      <div className="space-y-3 mb-6">
        {renderSlotCard(
          'morning',
          'Morning',
          '8:00 AM',
          <Sun className="w-6 h-6 text-[#27A348]" />,
          morningStatus,
          morningEvent,
          'bg-[#EBF7EE]'
        )}

        {renderSlotCard(
          'afternoon',
          'Afternoon',
          '2:00 PM',
          <Sunset className="w-6 h-6 text-[#F2B33D]" />,
          afternoonStatus,
          afternoonEvent,
          'bg-[#FEF7EC]'
        )}

        {renderSlotCard(
          'night',
          'Night',
          '9:00 PM',
          <Moon className="w-6 h-6 text-[#8E9E9C]" />,
          nightStatus,
          nightEvent,
          'bg-[#F0F7F6]'
        )}
      </div>

      {/* "This week" row matching screen 3 */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-[#E5EAE9]">
        <h2 className="text-xs font-semibold text-[#1F4E4B] mb-3">This week</h2>
        <div className="flex items-center justify-between px-1">
          {[
            { label: 'M', status: 'taken' },
            { label: 'T', status: 'taken' },
            { label: 'W', status: 'taken' },
            { label: 'T', status: 'taken' },
            { label: 'F', status: 'taken' },
            {
              label: 'S',
              status: afternoonStatus === 'taken' ? 'taken' : 'late',
            },
            { label: 'S', status: 'upcoming' },
          ].map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#8E9E9C]">{day.label}</span>
              {day.status === 'taken' ? (
                <div className="w-6 h-6 rounded-full bg-[#27A348] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : day.status === 'late' ? (
                <div className="w-6 h-6 rounded-full bg-[#F2B33D] text-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#E5EAE9]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick link to CareBox Simulator for demo testing */}
      <div className="mt-4 p-3 bg-[#E8F3F1] rounded-xl flex items-center justify-between text-xs text-[#2E7D79]">
        <span>Simulate physical pillbox touch:</span>
        <button
          onClick={() => setCurrentStep('simulator')}
          className="font-semibold underline hover:text-[#1F4E4B]"
        >
          Open Box Simulator →
        </button>
      </div>
    </div>
  );
};
