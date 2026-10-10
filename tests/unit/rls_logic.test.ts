import { describe, it, expect } from 'vitest';
import {
  canUserViewFamily,
  canUserEditMedicines,
  canUserManageMembers,
  canUserViewDoseEvents,
  canUserSendGentleNudge,
} from '../../src/lib/authRules';

describe('RLS & Authorization Rules', () => {
  describe('Outsider Access', () => {
    it('blocks outsiders from viewing family', () => {
      expect(canUserViewFamily(false)).toBe(false);
    });

    it('blocks outsiders from viewing dose events', () => {
      expect(canUserViewDoseEvents(null, false, false)).toBe(false);
    });

    it('blocks outsiders from editing medicines', () => {
      expect(canUserEditMedicines(null, false)).toBe(false);
    });
  });

  describe('Family Viewer Access', () => {
    const isMember = true;
    const role = 'viewer';

    it('allows viewer to view family', () => {
      expect(canUserViewFamily(isMember)).toBe(true);
    });

    it('proves viewer CANNOT edit medicines', () => {
      expect(canUserEditMedicines(role, isMember)).toBe(false);
    });

    it('proves viewer CANNOT manage or invite members', () => {
      expect(canUserManageMembers(role, isMember)).toBe(false);
    });

    it('allows viewer to view dose events when sharing is active', () => {
      expect(canUserViewDoseEvents(role, isMember, false)).toBe(true);
    });

    it('proves viewer CANNOT view dose events when parent pauses sharing', () => {
      expect(canUserViewDoseEvents(role, isMember, true)).toBe(false);
    });

    it('allows viewer to send a gentle nudge', () => {
      expect(canUserSendGentleNudge(role, isMember)).toBe(true);
    });
  });

  describe('Family Admin Access', () => {
    const isMember = true;
    const role = 'admin';

    it('allows admin to edit medicines', () => {
      expect(canUserEditMedicines(role, isMember)).toBe(true);
    });

    it('allows admin to manage members', () => {
      expect(canUserManageMembers(role, isMember)).toBe(true);
    });

    it('allows admin to view dose events even when sharing is paused', () => {
      expect(canUserViewDoseEvents(role, isMember, true)).toBe(true);
    });
  });
});
