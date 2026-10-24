import { Slot, DoseStatus, DoseEvent } from '../types';

export interface SlotConfig {
  slot: Slot;
  scheduledTimeMinutes: number; // minutes from midnight, e.g. 8:00 = 480
  label: string;
}

export const DEFAULT_SLOTS: SlotConfig[] = [
  { slot: 'morning', scheduledTimeMinutes: 8 * 60, label: '8:00 AM' },     // 08:00
  { slot: 'afternoon', scheduledTimeMinutes: 14 * 60, label: '2:00 PM' },  // 14:00
  { slot: 'night', scheduledTimeMinutes: 21 * 60, label: '9:00 PM' }       // 21:00
];

/**
 * Converts "HH:MM" string or hours/minutes into minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Computes pure dose status
 */
export function computeDoseStatus(
  slot: Slot,
  currentMinutesFromMidnight: number,
  doseEvent: DoseEvent | undefined,
  nudgeDelayMin: number = 60,
  slotsConfig: SlotConfig[] = DEFAULT_SLOTS
): DoseStatus {
  // 1. If dose was confirmed today -> taken
  if (doseEvent) {
    return 'taken';
  }

  const slotInfo = slotsConfig.find((s) => s.slot === slot);
  if (!slotInfo) return 'later';

  const scheduledTime = slotInfo.scheduledTimeMinutes;
  const lateTime = scheduledTime + nudgeDelayMin;

  // 2. If time has passed scheduledTime + nudge delay -> late
  if (currentMinutesFromMidnight >= lateTime) {
    return 'late';
  }

  // 3. If time has passed scheduledTime -> due
  if (currentMinutesFromMidnight >= scheduledTime) {
    return 'due';
  }

  // 4. Identify the first upcoming slot that isn't past scheduled time
  const upcomingSlots = slotsConfig
    .filter((s) => currentMinutesFromMidnight < s.scheduledTimeMinutes)
    .sort((a, b) => a.scheduledTimeMinutes - b.scheduledTimeMinutes);

  if (upcomingSlots.length > 0 && upcomingSlots[0].slot === slot) {
    return 'next';
  }

  return 'later';
}

/**
 * Core business rule: Gentle nudge eligibility
 * - only for a late dose
 * - only once per dose
 * - only if family has not already marked "I'll call her"
 */
export function canSendGentleNudge(
  status: DoseStatus,
  hasSentReminder: boolean,
  hasCalled: boolean
): boolean {
  if (status !== 'late') return false;
  if (hasSentReminder) return false;
  if (hasCalled) return false;
  return true;
}

/**
 * Calculate refill status
 */
export function isLowRefill(daysLeft: number): boolean {
  return daysLeft <= 5;
}

/**
 * Calculate adherence summary
 */
export function getWeeklyAdherenceSummary(takenCount: number, totalExpectedCount: number): string {
  return `Mom took ${takenCount} of ${totalExpectedCount} doses this week.`;
}

export interface ExpectedDose {
  slot: Slot;
  scheduledTime: string; // e.g. "08:00"
  label: string; // e.g. "8:00 AM"
  status: DoseStatus;
  event: DoseEvent | undefined;
}

/**
 * Pure schedule generator:
 * From dose_schedules, derives today's expected doses in the user's timezone (default Asia/Kolkata).
 */
export function generateDailySchedule(
  schedules: { slot: Slot; timeLocal: string; label?: string }[],
  currentDate: Date = new Date(),
  timezone: string = 'Asia/Kolkata',
  events: DoseEvent[] = [],
  nudgeDelayMin: number = 60
): ExpectedDose[] {
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(currentDate);

  const [hours, mins] = timeStr.split(':').map(Number);
  const currentMinutes = (hours || 0) * 60 + (mins || 0);

  const slotsConfig: SlotConfig[] = schedules.map((s) => ({
    slot: s.slot,
    scheduledTimeMinutes: timeStringToMinutes(s.timeLocal),
    label: s.label || s.timeLocal,
  }));

  return schedules.map((sched) => {
    const event = events.find((e) => e.slot === sched.slot);
    const status = computeDoseStatus(
      sched.slot,
      currentMinutes,
      event,
      nudgeDelayMin,
      slotsConfig
    );

    return {
      slot: sched.slot,
      scheduledTime: sched.timeLocal,
      label: sched.label || sched.timeLocal,
      status,
      event,
    };
  });
}

