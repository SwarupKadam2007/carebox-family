export type Slot = 'morning' | 'afternoon' | 'night';

export type DoseStatus = 'taken' | 'due' | 'late' | 'next' | 'later';

export interface DoseEvent {
  id: string;
  parentId: string;
  slot: Slot;
  eventDate: string; // YYYY-MM-DD
  takenAt: string; // ISO string
  source: 'box' | 'manual' | 'simulator';
}

export interface DoseSchedule {
  slot: Slot;
  timeLocal: string; // e.g. "08:00", "14:00", "21:00"
  label: string; // e.g. "8:05 AM"
}

export interface Medicine {
  id: string;
  parentId: string;
  name: string;
  strength: string; // "500mg"
  dosage: string; // "1 tablet • Morning & Night"
  slot: Slot | 'both';
  pillsLeft: number;
  pillsPerDose: number;
  daysLeft: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string; // "Son", "Daughter", "Spouse"
  role: 'admin' | 'viewer';
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

export interface ParentProfile {
  id: string;
  name: string;
  relationName: string; // "Mom"
  photoUrl: string;
  sharingPaused: boolean;
  boxConnected: boolean;
  boxId?: string;
  timezone: string;
  nudgeDelayMin: number;
}

export interface ReminderLog {
  id: string;
  parentId: string;
  slot: Slot;
  date: string;
  type: 'reminder' | 'call';
  sentBy: string;
  sentAt: string;
}

export interface PrivacySettings {
  showStatusOnly: boolean;
  gentleRemindersOnly: boolean;
  parentCanPauseSharing: boolean;
}

export type ScreenTab = 'today' | 'history' | 'refills' | 'settings';
export type AppFlowStep = 'welcome' | 'connect-box' | 'main' | 'simulator' | 'login' | 'consent' | 'invite';
