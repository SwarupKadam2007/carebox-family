import { ParentProfile, DoseEvent, Medicine, FamilyMember, DoseSchedule, PrivacySettings } from '../types';

export const INITIAL_PARENT: ParentProfile = {
  id: 'parent-1',
  name: 'Kalyani Kadam',
  relationName: 'Mom',
  photoUrl: '/images/mom_avatar.jpg',
  sharingPaused: false,
  boxConnected: true,
  boxId: 'CB-8842-PUNE',
  timezone: 'Asia/Kolkata',
  nudgeDelayMin: 60,
};

export const INITIAL_SCHEDULES: DoseSchedule[] = [
  { slot: 'morning', timeLocal: '08:00', label: '8:00 AM' },
  { slot: 'afternoon', timeLocal: '14:00', label: '2:00 PM' },
  { slot: 'night', timeLocal: '21:00', label: '9:00 PM' },
];

export const INITIAL_DOSE_EVENTS: DoseEvent[] = [
  {
    id: 'evt-morning-today',
    parentId: 'parent-1',
    slot: 'morning',
    eventDate: new Date().toISOString().split('T')[0],
    takenAt: '8:05 AM',
    source: 'box',
  },
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    parentId: 'parent-1',
    name: 'Metformin 500mg',
    strength: '500mg',
    dosage: '1 tablet • Morning & Night',
    slot: 'both',
    pillsLeft: 8,
    pillsPerDose: 2,
    daysLeft: 4,
  },
  {
    id: 'med-2',
    parentId: 'parent-1',
    name: 'Atorvastatin 10mg',
    strength: '10mg',
    dosage: '1 tablet • Night',
    slot: 'night',
    pillsLeft: 12,
    pillsPerDose: 1,
    daysLeft: 12,
  },
  {
    id: 'med-3',
    parentId: 'parent-1',
    name: 'Vitamin D3 1000 IU',
    strength: '1000 IU',
    dosage: '1 capsule • Morning',
    slot: 'morning',
    pillsLeft: 20,
    pillsPerDose: 1,
    daysLeft: 20,
  },
  {
    id: 'med-4',
    parentId: 'parent-1',
    name: 'Calcium + D3',
    strength: '500mg',
    dosage: '1 tablet • Night',
    slot: 'night',
    pillsLeft: 18,
    pillsPerDose: 1,
    daysLeft: 18,
  },
];

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'usr-1',
    name: 'You',
    relation: 'Son',
    role: 'admin',
    isCurrentUser: true,
  },
  {
    id: 'usr-2',
    name: 'Sneha',
    relation: 'Daughter',
    role: 'viewer',
  },
  {
    id: 'usr-3',
    name: 'Dad',
    relation: 'Spouse',
    role: 'viewer',
  },
];

export const INITIAL_PRIVACY_SETTINGS: PrivacySettings = {
  showStatusOnly: true,
  gentleRemindersOnly: true,
  parentCanPauseSharing: true,
};

// 7-day history matrix matching Screen 5 (Oct 6 - Oct 12, 2025)
export interface DayHistorySlot {
  dayLabel: string; // 'Mon', 'Tue', ...
  dateStr: string;  // 'Oct 6'
  morning: 'taken' | 'late' | 'missed' | 'upcoming';
  afternoon: 'taken' | 'late' | 'missed' | 'upcoming';
  night: 'taken' | 'late' | 'missed' | 'upcoming';
}

export const INITIAL_WEEK_MATRIX: DayHistorySlot[] = [
  { dayLabel: 'Mon', dateStr: 'Oct 6', morning: 'taken', afternoon: 'taken', night: 'taken' },
  { dayLabel: 'Tue', dateStr: 'Oct 7', morning: 'taken', afternoon: 'taken', night: 'taken' },
  { dayLabel: 'Wed', dateStr: 'Oct 8', morning: 'taken', afternoon: 'taken', night: 'taken' },
  { dayLabel: 'Thu', dateStr: 'Oct 9', morning: 'taken', afternoon: 'taken', night: 'taken' },
  { dayLabel: 'Fri', dateStr: 'Oct 10', morning: 'taken', afternoon: 'late', night: 'taken' },
  { dayLabel: 'Sat', dateStr: 'Oct 11', morning: 'taken', afternoon: 'late', night: 'upcoming' },
  { dayLabel: 'Sun', dateStr: 'Oct 12', morning: 'upcoming', afternoon: 'upcoming', night: 'upcoming' },
];
