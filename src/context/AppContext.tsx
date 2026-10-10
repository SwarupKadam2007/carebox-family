import React, { createContext, useContext, useState } from 'react';
import {
  ParentProfile,
  DoseEvent,
  Medicine,
  FamilyMember,
  PrivacySettings,
  ScreenTab,
  AppFlowStep,
  Slot,
  DoseStatus
} from '../types';
import {
  INITIAL_PARENT,
  INITIAL_DOSE_EVENTS,
  INITIAL_MEDICINES,
  INITIAL_FAMILY_MEMBERS,
  INITIAL_PRIVACY_SETTINGS
} from '../mocks/initialData';
import { computeDoseStatus } from '../lib/doseLogic';
import { playGentleChime, playConfirmClick } from '../lib/sound';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Flow and Navigation
  currentStep: AppFlowStep;
  setCurrentStep: (step: AppFlowStep) => void;
  currentTab: ScreenTab;
  setCurrentTab: (tab: ScreenTab) => void;
  subView: string | null;
  setSubView: (view: string | null) => void;

  // Domain state
  parent: ParentProfile;
  setParent: React.Dispatch<React.SetStateAction<ParentProfile>>;
  doseEvents: DoseEvent[];
  medicines: Medicine[];
  familyMembers: FamilyMember[];
  privacySettings: PrivacySettings;
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;

  // Simulated Time (minutes from midnight)
  simulatedMinutes: number;
  setSimulatedMinutes: (mins: number) => void;

  // Nudge state
  reminderSent: Record<Slot, boolean>;
  callLogged: Record<Slot, boolean>;
  nudgeModalOpen: boolean;
  setNudgeModalOpen: (open: boolean) => void;
  activeNudgeSlot: Slot;

  // Notifications & Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Actions
  confirmDose: (slot: Slot, source?: 'box' | 'manual' | 'simulator') => void;
  sendGentleNudge: (slot: Slot) => void;
  logCallWithParent: (slot: Slot) => void;
  toggleSharingPause: () => void;
  resetDemoDay: () => void;
  getSlotStatus: (slot: Slot) => DoseStatus;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<AppFlowStep>('main');
  const [currentTab, setCurrentTab] = useState<ScreenTab>('today');
  const [subView, setSubView] = useState<string | null>(null);

  const [parent, setParent] = useState<ParentProfile>(INITIAL_PARENT);
  const [doseEvents, setDoseEvents] = useState<DoseEvent[]>(INITIAL_DOSE_EVENTS);
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [familyMembers] = useState<FamilyMember[]>(INITIAL_FAMILY_MEMBERS);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(INITIAL_PRIVACY_SETTINGS);

  // Default simulated time: 2:05 PM (14 * 60 + 5 = 845 mins) -> Afternoon is Due 2:00 PM
  const [simulatedMinutes, setSimulatedMinutes] = useState<number>(14 * 60 + 5);

  const [reminderSent, setReminderSent] = useState<Record<Slot, boolean>>({
    morning: false,
    afternoon: false,
    night: false,
  });

  const [callLogged, setCallLogged] = useState<Record<Slot, boolean>>({
    morning: false,
    afternoon: false,
    night: false,
  });

  const [nudgeModalOpen, setNudgeModalOpen] = useState<boolean>(false);
  const [activeNudgeSlot] = useState<Slot>('afternoon');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  const getSlotStatus = (slot: Slot): DoseStatus => {
    const event = doseEvents.find((e) => e.slot === slot);
    return computeDoseStatus(slot, simulatedMinutes, event, parent.nudgeDelayMin);
  };

  const confirmDose = (slot: Slot, source: 'box' | 'manual' | 'simulator' = 'box') => {
    const existing = doseEvents.find((e) => e.slot === slot);
    if (existing) {
      showToast(`${parent.relationName}'s ${slot} dose is already confirmed.`);
      return;
    }

    playGentleChime();
    playConfirmClick();

    // Trigger celebratory micro-confetti
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2E7D79', '#27A348', '#F2B33D', '#E8F3F1'],
      });
    } catch {
      // ignore in headless test
    }

    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: parent.timezone,
    });

    const newEvent: DoseEvent = {
      id: `evt-${slot}-${Date.now()}`,
      parentId: parent.id,
      slot,
      eventDate: now.toISOString().split('T')[0],
      takenAt: timeFormatter.format(now),
      source,
    };

    setDoseEvents((prev) => [...prev, newEvent]);

    // Decrement pills left for matching medicines
    setMedicines((prevMeds) =>
      prevMeds.map((med) => {
        if (med.slot === slot || med.slot === 'both') {
          const updatedPills = Math.max(0, med.pillsLeft - med.pillsPerDose);
          const updatedDays = Math.max(0, Math.floor(updatedPills / (med.slot === 'both' ? 2 : 1)));
          return {
            ...med,
            pillsLeft: updatedPills,
            daysLeft: updatedDays,
          };
        }
        return med;
      })
    );

    // Close nudge modal if open for this slot
    if (nudgeModalOpen && activeNudgeSlot === slot) {
      setNudgeModalOpen(false);
    }

    showToast(`✓ ${parent.relationName}'s ${slot} medicine marked as taken.`);
  };

  const sendGentleNudge = (slot: Slot) => {
    setReminderSent((prev) => ({ ...prev, [slot]: true }));
    setNudgeModalOpen(false);
    playGentleChime();
    showToast(`Kind reminder sent to ${parent.relationName}'s CareBox.`);
  };

  const logCallWithParent = (slot: Slot) => {
    setCallLogged((prev) => ({ ...prev, [slot]: true }));
    setNudgeModalOpen(false);
    showToast(`Marked "I'll call ${parent.relationName}". Reminder suppressed.`);
  };

  const toggleSharingPause = () => {
    setParent((prev) => {
      const updated = !prev.sharingPaused;
      showToast(
        updated
          ? `${prev.relationName} paused sharing. Medicine status hidden from family.`
          : `${prev.relationName} resumed sharing. Family can view calm status.`
      );
      return { ...prev, sharingPaused: updated };
    });
  };

  const resetDemoDay = () => {
    setDoseEvents([
      {
        id: 'evt-morning-today',
        parentId: parent.id,
        slot: 'morning',
        eventDate: new Date().toISOString().split('T')[0],
        takenAt: '8:05 AM',
        source: 'box',
      },
    ]);
    setReminderSent({ morning: false, afternoon: false, night: false });
    setCallLogged({ morning: false, afternoon: false, night: false });
    setSimulatedMinutes(14 * 60 + 5); // 2:05 PM (Afternoon Due)
    showToast('Demo state reset: Morning taken, Afternoon due.');
  };

  return (
    <AppContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        currentTab,
        setCurrentTab,
        subView,
        setSubView,
        parent,
        setParent,
        doseEvents,
        medicines,
        familyMembers,
        privacySettings,
        setPrivacySettings,
        simulatedMinutes,
        setSimulatedMinutes,
        reminderSent,
        callLogged,
        nudgeModalOpen,
        setNudgeModalOpen,
        activeNudgeSlot,
        toastMessage,
        showToast,
        confirmDose,
        sendGentleNudge,
        logCallWithParent,
        toggleSharingPause,
        resetDemoDay,
        getSlotStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
