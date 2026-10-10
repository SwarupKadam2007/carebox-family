import { describe, it, expect } from 'vitest';
import { computeDoseStatus, canSendGentleNudge, isLowRefill } from '../../src/lib/doseLogic';
import { DoseEvent } from '../../src/types';

describe('computeDoseStatus', () => {
  const nudgeDelay = 60; // 60 mins

  it('returns "taken" if an event exists regardless of time', () => {
    const mockEvent: DoseEvent = {
      id: 'e1',
      parentId: 'p1',
      slot: 'morning',
      eventDate: '2026-10-10',
      takenAt: '2026-10-10T08:05:00Z',
      source: 'box'
    };
    const status = computeDoseStatus('morning', 12 * 60, mockEvent, nudgeDelay);
    expect(status).toBe('taken');
  });

  it('returns "next" for the morning dose if current time is early morning (7:00 AM)', () => {
    const status = computeDoseStatus('morning', 7 * 60, undefined, nudgeDelay);
    expect(status).toBe('next');
  });

  it('returns "later" for the afternoon and night doses if it is early morning', () => {
    expect(computeDoseStatus('afternoon', 7 * 60, undefined, nudgeDelay)).toBe('later');
    expect(computeDoseStatus('night', 7 * 60, undefined, nudgeDelay)).toBe('later');
  });

  it('returns "due" if scheduled time has passed but within nudge delay', () => {
    // 08:30 AM is between 08:00 and 09:00
    const status = computeDoseStatus('morning', 8 * 60 + 30, undefined, nudgeDelay);
    expect(status).toBe('due');
  });

  it('returns "late" if time has passed scheduled time + nudge delay', () => {
    // 09:15 AM is past 09:00 AM
    const status = computeDoseStatus('morning', 9 * 60 + 15, undefined, nudgeDelay);
    expect(status).toBe('late');
  });
});

describe('canSendGentleNudge', () => {
  it('allows nudge only if status is late and neither reminder nor call was made', () => {
    expect(canSendGentleNudge('late', false, false)).toBe(true);
    expect(canSendGentleNudge('due', false, false)).toBe(false);
    expect(canSendGentleNudge('taken', false, false)).toBe(false);
    expect(canSendGentleNudge('later', false, false)).toBe(false);
  });

  it('blocks nudge if reminder has already been sent', () => {
    expect(canSendGentleNudge('late', true, false)).toBe(false);
  });

  it('blocks nudge if family marked "I will call her"', () => {
    expect(canSendGentleNudge('late', false, true)).toBe(false);
  });
});

describe('isLowRefill', () => {
  it('flags low refill when days left <= 5', () => {
    expect(isLowRefill(4)).toBe(true);
    expect(isLowRefill(5)).toBe(true);
    expect(isLowRefill(6)).toBe(false);
    expect(isLowRefill(12)).toBe(false);
  });
});
