/**
 * Security & Input Sanitization Library
 * Protects against XSS, injection attacks, prototype pollution, and malformed inputs.
 */
import type { Slot } from '../types';

/**
 * Strips HTML tags and dangerous characters to prevent Stored & Reflected XSS.
 * Enforces maximum input length to prevent denial-of-service / buffer payloads.
 */
export function sanitizeText(input: unknown, maxLength: number = 100): string {
  if (typeof input !== 'string') return '';
  
  // Strip null bytes and control characters
  let clean = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip all HTML/XML tags
  clean = clean.replace(/<[^>]*>?/gm, '');

  // Escape dangerous entities
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Trim and enforce length limit
  return clean.trim().slice(0, maxLength);
}

/**
 * Validates and sanitizes email addresses according to RFC 5322 specs.
 * Rejects control characters, newline injections, and overly long inputs.
 */
export function sanitizeEmail(email: unknown): { isValid: boolean; sanitized: string } {
  if (typeof email !== 'string') return { isValid: false, sanitized: '' };

  const trimmed = email.trim().toLowerCase();

  // Maximum RFC email length is 254
  if (trimmed.length === 0 || trimmed.length > 254) {
    return { isValid: false, sanitized: '' };
  }

  // Reject newline/CR injection
  if (/[\r\n]/.test(trimmed)) {
    return { isValid: false, sanitized: '' };
  }

  // Strict regex for valid email format
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, sanitized: '' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Whitelists dose slots to prevent arbitrary parameter injection.
 */
export function sanitizeSlot(slot: unknown): Slot | null {
  if (slot === 'morning' || slot === 'afternoon' || slot === 'night') {
    return slot;
  }
  return null;
}

/**
 * Whitelists user roles strictly to 'admin' or 'viewer'.
 */
export function sanitizeRole(role: unknown): 'admin' | 'viewer' | null {
  if (role === 'admin' || role === 'viewer') {
    return role;
  }
  return null;
}

/**
 * Validates and sanitizes device box IDs.
 * Allows only alphanumeric characters, dashes, and underscores (max 64 chars).
 */
export function sanitizeBoxId(boxId: unknown): string {
  if (typeof boxId !== 'string') return '';
  const trimmed = boxId.trim();
  if (/^[a-zA-Z0-9_-]{1,64}$/.test(trimmed)) {
    return trimmed;
  }
  return '';
}

/**
 * Parses JSON safely without prototype pollution.
 */
export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object') {
      // Disallow __proto__, constructor, prototype tampering
      const record = parsed as Record<string, unknown>;
      Reflect.deleteProperty(record, '__proto__');
      Reflect.deleteProperty(record, 'constructor');
      Reflect.deleteProperty(record, 'prototype');
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Simple in-memory client-side rate limiter / debouncer to prevent duplicate requests.
 */
export class ClientRateLimiter {
  private lastActionTimestamps = new Map<string, number>();

  /**
   * Check if action is allowed given minimum interval in milliseconds
   */
  canExecute(actionKey: string, minIntervalMs: number = 1000): boolean {
    const now = Date.now();
    const lastTime = this.lastActionTimestamps.get(actionKey) ?? 0;
    if (now - lastTime < minIntervalMs) {
      return false;
    }
    this.lastActionTimestamps.set(actionKey, now);
    return true;
  }

  reset(actionKey?: string) {
    if (actionKey) {
      this.lastActionTimestamps.delete(actionKey);
    } else {
      this.lastActionTimestamps.clear();
    }
  }
}

export const globalClientRateLimiter = new ClientRateLimiter();
