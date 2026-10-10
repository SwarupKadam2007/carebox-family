import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  INITIAL_PRIVACY_SETTINGS,
  MOCK_PARENT_ID,
  MOCK_FAMILY_ID,
} from '../mocks/initialData';
import { computeDoseStatus } from '../lib/doseLogic';
import { playGentleChime, playConfirmClick } from '../lib/sound';
import {
  fetchTodayDoseEvents,
  fetchParentProfile,
  fetchMedicines,
  fetchFamilyMembers,
  insertDoseEvent,
  updateSharingPause,
  insertReminder,
} from '../lib/dataService';
import { subscribeToRealtimeUpdates } from '../lib/realtimeService';
import { IS_SUPABASE_CONFIGURED } from '../lib/supabase';
import { useAuth } from './AuthContext';
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
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  familyMembers: FamilyMember[];
  privacySettings: PrivacySettings;
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;

  // Loading state
  isLoading: boolean;

  // Simulated Time (minutes from midnight)
  simulatedMinutes: number;
  setSimulatedMinutes: (mins: number) => void;

  // Nudge state
  reminderSent: Record<Slot, boolean>;
  callLogged: Record<Slot, boolean>;
  nudgeModalOpen: boolean;
  setNudgeModalOpen: (open: boolean) => void;
  activeNudgeSlot: Slot;
  setActiveNudgeSlot: (slot: Slot) => void;

  // Notifications & Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // In-app notification badge
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;

  // Actions
  confirmDose: (slot: Slot, source?: 'box' | 'manual' | 'simulator') => void;
  sendGentleNudge: (slot: Slot) => void;
  logCallWithParent: (slot: Slot) => void;
  toggleSharingPause: () => void;
  resetDemoDay: () => void;
  getSlotStatus: (slot: Slot) => DoseStatus;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<AppFlowStep>('main');
  const [currentTab, setCurrentTab] = useState<ScreenTab>('today');
  const [subView, setSubView] = useState<string | null>(null);

  const [parent, setParent] = useState<ParentProfile>(INITIAL_PARENT);
  const [doseEvents, setDoseEvents] = useState<DoseEvent[]>(INITIAL_DOSE_EVENTS);
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(INITIAL_FAMILY_MEMBERS);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(INITIAL_PRIVACY_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Default simulated time: 2:05 PM (14 * 60 + 5 = 845 mins) → Afternoon is Due
  const [simulatedMinutes, setSimulatedMinutes] = useState<number>(14 * 60 + 5);

  const [reminderSent, setReminderSent] = useState<Record<Slot, boolean>>({
    morning: false, afternoon: false, night: false,
  });
  const [callLogged, setCallLogged] = useState<Record<Slot, boolean>>({
    morning: false, afternoon: false, night: false,
  });

  const [nudgeModalOpen, setNudgeModalOpen] = useState<boolean>(false);
  const [activeNudgeSlot, setActiveNudgeSlot] = useState<Slot>('afternoon');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  // ─── Load data from Supabase (or mocks) ──────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!IS_SUPABASE_CONFIGURED) return; // use initial mock state

    setIsLoading(true);
    try {
      const [parentData, eventsData, medsData, membersData] = await Promise.all([
        fetchParentProfile(MOCK_PARENT_ID),
        fetchTodayDoseEvents(MOCK_PARENT_ID),
        fetchMedicines(MOCK_PARENT_ID),
        fetchFamilyMembers(MOCK_FAMILY_ID),
      ]);
      if (parentData) setParent(parentData);
      setDoseEvents(eventsData);
      setMedicines(medsData);
      if (membersData.length > 0) setFamilyMembers(membersData);
    } catch (e) {
      console.error('[CareBox] refreshData failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on auth ready
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  // ─── Realtime subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    if (!user || !IS_SUPABASE_CONFIGURED) return;

    const unsubscribe = subscribeToRealtimeUpdates(MOCK_PARENT_ID, user.id, {
      onDoseConfirmed: (event) => {
        setDoseEvents((prev) => {
          if (prev.some((e) => e.id === event.id)) return prev;
          return [...prev, event];
        });
        playGentleChime();
        showToast(`✓ ${parent.relationName}'s ${event.slot} medicine confirmed!`);
        try {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 },
            colors: ['#2E7D79', '#27A348', '#F2B33D', '#E8F3F1'] });
        } catch { /* ignore in headless */ }
      },
      onSharingPauseChanged: (paused) => {
        setParent((prev) => ({ ...prev, sharingPaused: paused }));
        showToast(paused
          ? `Sharing paused by ${parent.relationName}.`
          : `${parent.relationName} resumed sharing.`);
      },
      onNotificationReceived: (notif) => {
        setUnreadCount((c) => c + 1);
        showToast(notif.title);
      },
    });

    return unsubscribe;
  }, [user, parent.relationName, showToast]);

  // ─── Computed status ──────────────────────────────────────────────────────
  const getSlotStatus = useCallback((slot: Slot): DoseStatus => {
    const event = doseEvents.find((e) => e.slot === slot);
    return computeDoseStatus(slot, simulatedMinutes, event, parent.nudgeDelayMin);
  }, [doseEvents, simulatedMinutes, parent.nudgeDelayMin]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const confirmDose = useCallback((slot: Slot, source: 'box' | 'manual' | 'simulator' = 'box') => {
    const existing = doseEvents.find((e) => e.slot === slot);
    if (existing) {
      showToast(`${parent.relationName}'s ${slot} dose is already confirmed.`);
      return;
    }

    // Optimistic update first (feels instant)
    playGentleChime();
    playConfirmClick();
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 },
        colors: ['#2E7D79', '#27A348', '#F2B33D', '#E8F3F1'] });
    } catch { /* headless */ }

    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: parent.timezone,
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

    // Persist to Supabase (fire-and-forget; errors logged)
    if (IS_SUPABASE_CONFIGURED) {
      insertDoseEvent(parent.id, slot, source).then(({ error }) => {
        if (error && error !== 'already_recorded') {
          console.error('[CareBox] insertDoseEvent error:', error);
        }
      });
    }

    // Decrement pills
    setMedicines((prevMeds) => prevMeds.map((med) => {
      if (med.slot === slot || med.slot === 'both') {
        const updatedPills = Math.max(0, med.pillsLeft - med.pillsPerDose);
        const divisor = med.slot === 'both' ? 2 : 1;
        return { ...med, pillsLeft: updatedPills, daysLeft: Math.max(0, Math.floor(updatedPills / divisor)) };
      }
      return med;
    }));

    if (nudgeModalOpen && activeNudgeSlot === slot) setNudgeModalOpen(false);
    showToast(`✓ ${parent.relationName}'s ${slot} medicine marked as taken.`);
  }, [doseEvents, parent, nudgeModalOpen, activeNudgeSlot, showToast]);

  const sendGentleNudge = useCallback((slot: Slot) => {
    setReminderSent((prev) => ({ ...prev, [slot]: true }));
    setNudgeModalOpen(false);
    playGentleChime();
    showToast(`Kind reminder sent to ${parent.relationName}'s CareBox.`);
    if (IS_SUPABASE_CONFIGURED && user) {
      insertReminder(parent.id, slot, 'reminder', user.id).catch(console.error);
    }
  }, [parent.id, parent.relationName, user, showToast]);

  const logCallWithParent = useCallback((slot: Slot) => {
    setCallLogged((prev) => ({ ...prev, [slot]: true }));
    setNudgeModalOpen(false);
    showToast(`Marked "I'll call ${parent.relationName}". Reminder suppressed.`);
    if (IS_SUPABASE_CONFIGURED && user) {
      insertReminder(parent.id, slot, 'call', user.id).catch(console.error);
    }
  }, [parent.id, parent.relationName, user, showToast]);

  const toggleSharingPause = useCallback(() => {
    setParent((prev) => {
      const updated = !prev.sharingPaused;
      showToast(updated
        ? `${prev.relationName} paused sharing. Medicine status hidden from family.`
        : `${prev.relationName} resumed sharing. Family can view calm status.`);
      if (IS_SUPABASE_CONFIGURED) {
        updateSharingPause(prev.id, updated).catch(console.error);
      }
      return { ...prev, sharingPaused: updated };
    });
  }, [showToast]);

  const resetDemoDay = useCallback(() => {
    setDoseEvents([{
      id: 'evt-morning-today',
      parentId: parent.id,
      slot: 'morning',
      eventDate: new Date().toISOString().split('T')[0],
      takenAt: '8:05 AM',
      source: 'box',
    }]);
    setReminderSent({ morning: false, afternoon: false, night: false });
    setCallLogged({ morning: false, afternoon: false, night: false });
    setSimulatedMinutes(14 * 60 + 5);
    showToast('Demo state reset: Morning taken, Afternoon due.');
  }, [parent.id, showToast]);

  return (
    <AppContext.Provider value={{
      currentStep, setCurrentStep,
      currentTab, setCurrentTab,
      subView, setSubView,
      parent, setParent,
      doseEvents,
      medicines, setMedicines,
      familyMembers,
      privacySettings, setPrivacySettings,
      isLoading,
      simulatedMinutes, setSimulatedMinutes,
      reminderSent, callLogged,
      nudgeModalOpen, setNudgeModalOpen,
      activeNudgeSlot, setActiveNudgeSlot,
      toastMessage, showToast,
      unreadCount, setUnreadCount,
      confirmDose, sendGentleNudge, logCallWithParent,
      toggleSharingPause, resetDemoDay, getSlotStatus,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
