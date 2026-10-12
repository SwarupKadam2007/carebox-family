import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeSlot,
  sanitizeRole,
  sanitizeBoxId,
  safeJsonParse,
  ClientRateLimiter,
} from '../../src/lib/security';

describe('Security & Sanitization Library', () => {
  describe('sanitizeText', () => {
    it('strips HTML script tags and dangerous event handlers', () => {
      const malicious = '<script>alert("xss")</script>Hello <img src="x" onerror="alert(1)"> World';
      const clean = sanitizeText(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<img');
      expect(clean).toBe('alert(&quot;xss&quot;)Hello  World');
    });

    it('removes ASCII control characters and null bytes', () => {
      const payload = 'Mom\x00\x08\x1F';
      expect(sanitizeText(payload)).toBe('Mom');
    });

    it('enforces maximum length bounds', () => {
      const longInput = 'A'.repeat(500);
      expect(sanitizeText(longInput, 30).length).toBe(30);
    });

    it('handles non-string values gracefully', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText(123)).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('accepts valid email addresses and normalizes case', () => {
      const result = sanitizeEmail('  SWARUP@CareBox.Family  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('swarup@carebox.family');
    });

    it('rejects email headers with CRLF injection', () => {
      const result = sanitizeEmail('victim@example.com\r\nBcc: hacker@example.com');
      expect(result.isValid).toBe(false);
    });

    it('rejects invalid email formats', () => {
      expect(sanitizeEmail('invalid-email').isValid).toBe(false);
      expect(sanitizeEmail('@no-user.com').isValid).toBe(false);
      expect(sanitizeEmail('user@').isValid).toBe(false);
      expect(sanitizeEmail('').isValid).toBe(false);
    });

    it('rejects emails exceeding RFC 254 characters', () => {
      const superLong = 'a'.repeat(250) + '@example.com';
      expect(sanitizeEmail(superLong).isValid).toBe(false);
    });
  });

  describe('sanitizeSlot', () => {
    it('accepts only valid slot identifiers', () => {
      expect(sanitizeSlot('morning')).toBe('morning');
      expect(sanitizeSlot('afternoon')).toBe('afternoon');
      expect(sanitizeSlot('night')).toBe('night');
    });

    it('rejects arbitrary string injection', () => {
      expect(sanitizeSlot('midnight')).toBeNull();
      expect(sanitizeSlot("'; DROP TABLE dose_events; --")).toBeNull();
      expect(sanitizeSlot(null)).toBeNull();
    });
  });

  describe('sanitizeRole', () => {
    it('accepts only admin and viewer', () => {
      expect(sanitizeRole('admin')).toBe('admin');
      expect(sanitizeRole('viewer')).toBe('viewer');
    });

    it('rejects privilege escalation role attempts', () => {
      expect(sanitizeRole('superadmin')).toBeNull();
      expect(sanitizeRole('root')).toBeNull();
      expect(sanitizeRole(123)).toBeNull();
    });
  });

  describe('sanitizeBoxId', () => {
    it('accepts valid hardware box IDs', () => {
      expect(sanitizeBoxId('CB-8842-PUNE')).toBe('CB-8842-PUNE');
      expect(sanitizeBoxId('box_1234_dev')).toBe('box_1234_dev');
    });

    it('rejects malicious characters in box IDs', () => {
      expect(sanitizeBoxId('../etc/passwd')).toBe('');
      expect(sanitizeBoxId('box; rm -rf /')).toBe('');
      expect(sanitizeBoxId('box with spaces')).toBe('');
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON correctly', () => {
      const result = safeJsonParse('{"name": "CareBox"}', {});
      expect(result).toEqual({ name: 'CareBox' });
    });

    it('neutralizes prototype pollution keys', () => {
      const malicious = '{"__proto__": {"polluted": true}, "name": "Safe"}';
      const result = safeJsonParse(malicious, {});
      expect(result).toEqual({ name: 'Safe' });
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('returns fallback on invalid JSON', () => {
      const fallback = { fallback: true };
      expect(safeJsonParse('{invalid}', fallback)).toEqual(fallback);
    });
  });

  describe('ClientRateLimiter', () => {
    it('allows initial execution and throttles within interval', () => {
      const limiter = new ClientRateLimiter();
      expect(limiter.canExecute('test_action', 1000)).toBe(true);
      expect(limiter.canExecute('test_action', 1000)).toBe(false);
    });

    it('allows execution after interval has passed', async () => {
      const limiter = new ClientRateLimiter();
      expect(limiter.canExecute('timer_test', 10)).toBe(true);
      expect(limiter.canExecute('timer_test', 10)).toBe(false);
      await new Promise((res) => setTimeout(res, 15));
      expect(limiter.canExecute('timer_test', 10)).toBe(true);
    });

    it('isolates different action keys', () => {
      const limiter = new ClientRateLimiter();
      expect(limiter.canExecute('action_a', 1000)).toBe(true);
      expect(limiter.canExecute('action_b', 1000)).toBe(true);
      expect(limiter.canExecute('action_a', 1000)).toBe(false);
      expect(limiter.canExecute('action_b', 1000)).toBe(false);
    });
  });

  describe('RBAC & Least Privilege Authorization Rules', () => {
    it('canUserConnectBox: permits only admin family members', async () => {
      const { canUserConnectBox } = await import('../../src/lib/authRules');
      expect(canUserConnectBox('admin', true)).toBe(true);
      expect(canUserConnectBox('viewer', true)).toBe(false);
      expect(canUserConnectBox('admin', false)).toBe(false);
      expect(canUserConnectBox(null, true)).toBe(false);
    });

    it('canUserAccessSimulator: permits only admin family members', async () => {
      const { canUserAccessSimulator } = await import('../../src/lib/authRules');
      expect(canUserAccessSimulator('admin', true)).toBe(true);
      expect(canUserAccessSimulator('viewer', true)).toBe(false);
      expect(canUserAccessSimulator('admin', false)).toBe(false);
      expect(canUserAccessSimulator(null, true)).toBe(false);
    });

    it('canUserAccessAdminRoutes: blocks non-admins and outsiders', async () => {
      const { canUserAccessAdminRoutes } = await import('../../src/lib/authRules');
      expect(canUserAccessAdminRoutes('admin', true)).toBe(true);
      expect(canUserAccessAdminRoutes('viewer', true)).toBe(false);
      expect(canUserAccessAdminRoutes(null, false)).toBe(false);
    });

    it('canUserModifySharingPause: protects privacy settings from viewers', async () => {
      const { canUserModifySharingPause } = await import('../../src/lib/authRules');
      expect(canUserModifySharingPause('admin', true)).toBe(true);
      expect(canUserModifySharingPause('viewer', true)).toBe(false);
      expect(canUserModifySharingPause(null, false)).toBe(false);
    });

    it('canUserViewDoseEvents: strictly enforces dignity toggle for viewers', async () => {
      const { canUserViewDoseEvents } = await import('../../src/lib/authRules');
      // Admin sees doses even when paused (for clinical oversight)
      expect(canUserViewDoseEvents('admin', true, true)).toBe(true);
      expect(canUserViewDoseEvents('admin', true, false)).toBe(true);

      // Viewer cannot see doses when parent has activated Pause Sharing
      expect(canUserViewDoseEvents('viewer', true, false)).toBe(true);
      expect(canUserViewDoseEvents('viewer', true, true)).toBe(false);

      // Outsider sees nothing
      expect(canUserViewDoseEvents('admin', false, false)).toBe(false);
      expect(canUserViewDoseEvents('viewer', false, false)).toBe(false);
    });
  });
});

