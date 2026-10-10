/**
 * Authorization and Role-Based Access Control logic
 * Enforces the exact same security rules in the client as Postgres RLS policies:
 * - Outsider: sees 0 rows
 * - Viewer: view-only; CANNOT edit medicines or invite members
 * - Parent Pause Sharing: hides dose details from viewers immediately
 * - Admin: full edit capabilities
 */

export type UserRole = 'admin' | 'viewer';

export function canUserViewFamily(isFamilyMember: boolean): boolean {
  return isFamilyMember;
}

export function canUserEditMedicines(role: UserRole | null, isFamilyMember: boolean): boolean {
  if (!isFamilyMember || !role) return false;
  return role === 'admin';
}

export function canUserManageMembers(role: UserRole | null, isFamilyMember: boolean): boolean {
  if (!isFamilyMember || !role) return false;
  return role === 'admin';
}

export function canUserViewDoseEvents(
  role: UserRole | null,
  isFamilyMember: boolean,
  isSharingPaused: boolean
): boolean {
  if (!isFamilyMember || !role) return false;

  // Admin always has visibility for care oversight
  if (role === 'admin') return true;

  // Viewer is strictly subject to the parent's dignity toggle
  if (role === 'viewer') {
    return !isSharingPaused;
  }

  return false;
}

export function canUserSendGentleNudge(
  role: UserRole | null,
  isFamilyMember: boolean
): boolean {
  if (!isFamilyMember || !role) return false;
  return true; // Any active family member can send a gentle reminder
}
