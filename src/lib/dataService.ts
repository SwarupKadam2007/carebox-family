/**
 * Data service — all Supabase database reads and writes.
 * Gracefully falls back to mock data when Supabase is not configured.
 */
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import {
  INITIAL_PARENT,
  INITIAL_DOSE_EVENTS,
  INITIAL_MEDICINES,
  INITIAL_FAMILY_MEMBERS,
  INITIAL_SCHEDULES,
  INITIAL_PRIVACY_SETTINGS,
} from '../mocks/initialData';
import type { DoseEvent, Medicine, FamilyMember, ParentProfile, DoseSchedule, Slot } from '../types';
import { sanitizeText, sanitizeEmail, sanitizeSlot, sanitizeRole } from './security';

// ─── Read: Today's Dose Events ────────────────────────────────────────────────
export async function fetchTodayDoseEvents(parentId: string): Promise<DoseEvent[]> {
  if (!IS_SUPABASE_CONFIGURED) return INITIAL_DOSE_EVENTS;

  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('dose_events')
    .select('*')
    .eq('parent_id', parentId)
    .eq('event_date', today);

  if (error) { console.error('[CareBox] fetchTodayDoseEvents:', error); return []; }

  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    parentId: row.parent_id,
    slot: row.slot as Slot,
    eventDate: row.event_date,
    takenAt: new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    }).format(new Date(row.taken_at)),
    source: row.source as DoseEvent['source'],
  }));
}

// ─── Write: Confirm a dose ────────────────────────────────────────────────────
export async function insertDoseEvent(
  parentId: string,
  slot: Slot,
  source: 'box' | 'manual' | 'simulator' = 'manual'
): Promise<{ id: string | null; error: string | null }> {
  const safeSlot = sanitizeSlot(slot);
  if (!safeSlot) return { id: null, error: 'Invalid slot' };
  const safeSource = source === 'box' || source === 'manual' || source === 'simulator' ? source : 'manual';

  if (!IS_SUPABASE_CONFIGURED) {
    return { id: `mock-evt-${safeSlot}-${Date.now()}`, error: null };
  }

  const { data, error } = await supabase
    .from('dose_events')
    .insert({ parent_id: parentId, slot: safeSlot, source: safeSource } as any)
    .select('id')
    .single();

  if (error) {
    // 409 conflict = already recorded today — return gracefully
    if (error.code === '23505') {
      return { id: null, error: 'already_recorded' };
    }
    return { id: null, error: error.message };
  }

  // Decrement pills_left for medicines in this slot
  try {
    await (supabase.rpc as any)('decrement_pills', { p_parent_id: parentId, p_slot: slot });
  } catch (e: unknown) {
    console.warn('[CareBox] decrement_pills RPC not yet set up:', e);
  }

  return { id: (data as any)?.id ?? null, error: null };
}

// ─── Read: Parent Profile ─────────────────────────────────────────────────────
export async function fetchParentProfile(parentId: string): Promise<ParentProfile | null> {
  if (!IS_SUPABASE_CONFIGURED) return INITIAL_PARENT;

  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('id', parentId)
    .single();

  if (error) { console.error('[CareBox] fetchParentProfile:', error); return null; }
  if (!data) return null;

  const d = data as any;
  return {
    id: d.id,
    name: d.name,
    relationName: 'Mom',
    photoUrl: d.photo_url ?? '/images/mom_avatar.jpg',
    sharingPaused: d.sharing_paused,
    boxConnected: true,
    timezone: d.timezone,
    nudgeDelayMin: d.nudge_delay_min,
  };
}

// ─── Write: Toggle sharing pause ──────────────────────────────────────────────
export async function updateSharingPause(parentId: string, paused: boolean): Promise<{ error: string | null }> {
  if (!IS_SUPABASE_CONFIGURED) return { error: null };

  const { error } = await supabase
    .from('parents')
    .update({ sharing_paused: paused } as any)
    .eq('id', parentId);

  return { error: error?.message ?? null };
}

// ─── Read: Medicines ──────────────────────────────────────────────────────────
export async function fetchMedicines(parentId: string): Promise<Medicine[]> {
  if (!IS_SUPABASE_CONFIGURED) return INITIAL_MEDICINES;

  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('parent_id', parentId)
    .eq('active', true)
    .order('created_at');

  if (error) { console.error('[CareBox] fetchMedicines:', error); return []; }

  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    strength: row.strength ?? '',
    dosage: row.dosage_text ?? '',
    slot: row.slot as Medicine['slot'],
    pillsLeft: row.pills_left,
    pillsPerDose: row.pills_per_dose,
    daysLeft: row.pills_per_dose > 0
      ? Math.floor(row.pills_left / row.pills_per_dose)
      : 0,
  }));
}

// ─── Write: Insert Medicine ───────────────────────────────────────────────────
export async function insertMedicine(
  parentId: string,
  med: {
    name: string;
    strength?: string;
    dosage?: string;
    slot: Medicine['slot'];
    pillsLeft: number;
    pillsPerDose: number;
  }
): Promise<{ id: string | null; error: string | null }> {
  const cleanName = sanitizeText(med.name, 100);
  if (!cleanName) return { id: null, error: 'Medicine name is required' };

  if (!IS_SUPABASE_CONFIGURED) {
    return { id: `mock-med-${Date.now()}`, error: null };
  }

  const { data, error } = await supabase
    .from('medicines')
    .insert({
      parent_id: parentId,
      name: cleanName,
      strength: sanitizeText(med.strength || '', 50),
      dosage_text: sanitizeText(med.dosage || '', 100),
      slot: med.slot,
      pills_left: Math.max(0, med.pillsLeft),
      pills_per_dose: Math.max(1, med.pillsPerDose),
      active: true,
    } as any)
    .select('id')
    .single();

  return { id: (data as any)?.id ?? null, error: error?.message ?? null };
}

// ─── Write: Update Medicine ───────────────────────────────────────────────────
export async function updateMedicine(
  medicineId: string,
  updates: Partial<Omit<Medicine, 'id' | 'parentId' | 'daysLeft'>>
): Promise<{ error: string | null }> {
  if (!IS_SUPABASE_CONFIGURED) return { error: null };

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = sanitizeText(updates.name, 100);
  if (updates.strength !== undefined) payload.strength = sanitizeText(updates.strength, 50);
  if (updates.dosage !== undefined) payload.dosage_text = sanitizeText(updates.dosage, 100);
  if (updates.slot !== undefined) payload.slot = updates.slot;
  if (updates.pillsLeft !== undefined) payload.pills_left = Math.max(0, updates.pillsLeft);
  if (updates.pillsPerDose !== undefined) payload.pills_per_dose = Math.max(1, updates.pillsPerDose);

  const { error } = await supabase
    .from('medicines')
    .update(payload as any)
    .eq('id', medicineId);

  return { error: error?.message ?? null };
}

// ─── Write: Delete Medicine ───────────────────────────────────────────────────
export async function deleteMedicine(medicineId: string): Promise<{ error: string | null }> {
  if (!IS_SUPABASE_CONFIGURED) return { error: null };

  const { error } = await supabase
    .from('medicines')
    .delete()
    .eq('id', medicineId);

  return { error: error?.message ?? null };
}

// ─── Read: Family Members ─────────────────────────────────────────────────────
export async function fetchFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  if (!IS_SUPABASE_CONFIGURED) return INITIAL_FAMILY_MEMBERS;

  const { data, error } = await supabase
    .from('members')
    .select(`
      id,
      role,
      status,
      profiles:user_id (id, name, avatar_url)
    `)
    .eq('family_id', familyId)
    .eq('status', 'active');

  if (error) { console.error('[CareBox] fetchFamilyMembers:', error); return []; }

  return ((data as any[]) ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: (profile as { id: string })?.id ?? row.id,
      name: (profile as { name: string })?.name ?? 'Member',
      relation: '',
      role: row.role as 'admin' | 'viewer',
      avatarUrl: (profile as { avatar_url: string | null })?.avatar_url ?? undefined,
    };
  });
}

// ─── Read: Dose Schedules ─────────────────────────────────────────────────────
export async function fetchDoseSchedules(parentId: string): Promise<DoseSchedule[]> {
  if (!IS_SUPABASE_CONFIGURED) return INITIAL_SCHEDULES;

  const { data, error } = await supabase
    .from('dose_schedules')
    .select('*')
    .eq('parent_id', parentId)
    .eq('active', true);

  if (error) { console.error('[CareBox] fetchDoseSchedules:', error); return []; }

  return ((data as any[]) ?? []).map((row) => ({
    slot: row.slot as Slot,
    timeLocal: row.time_local.substring(0, 5),
    label: formatTimeLocal(row.time_local),
  }));
}

// ─── Write: Insert Reminder (gentle nudge or "I'll call her") ────────────────
export async function insertReminder(
  parentId: string,
  slot: Slot,
  type: 'reminder' | 'call',
  sentBy: string
): Promise<{ id: string | null; error: string | null }> {
  const safeSlot = sanitizeSlot(slot);
  if (!safeSlot) return { id: null, error: 'Invalid slot' };
  const safeType = type === 'reminder' || type === 'call' ? type : 'reminder';

  if (!IS_SUPABASE_CONFIGURED) {
    return { id: `mock-reminder-${Date.now()}`, error: null };
  }

  const { data, error } = await supabase
    .from('reminders')
    .insert({ parent_id: parentId, slot: safeSlot, type: safeType, sent_by: sentBy } as any)
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { id: null, error: 'already_sent' };
    return { id: null, error: error.message };
  }

  return { id: (data as any)?.id ?? null, error: null };
}

// ─── Write: Invite family member by email ────────────────────────────────────
export async function inviteFamilyMember(
  familyId: string,
  inviterName: string,
  inviteeEmail: string,
  role: 'admin' | 'viewer' = 'viewer'
): Promise<{ error: string | null }> {
  const { isValid, sanitized: safeEmail } = sanitizeEmail(inviteeEmail);
  if (!isValid) return { error: 'Invalid email address' };

  const safeRole = sanitizeRole(role) || 'viewer';
  const safeInviter = sanitizeText(inviterName, 50) || 'A family member';

  if (!IS_SUPABASE_CONFIGURED) {
    console.log(`[CareBox] Demo: would invite ${safeEmail} as ${safeRole} to family ${familyId}`);
    return { error: null };
  }

  // Step 1: Send invitation magic link via Supabase Auth
  const { error: inviteError } = await supabase.auth.signInWithOtp({
    email: safeEmail,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?family_id=${familyId}&role=${safeRole}`,
      shouldCreateUser: true,
      data: {
        invited_by: safeInviter,
        family_id: familyId,
        role: safeRole,
      },
    },
  });

  if (inviteError) return { error: inviteError.message };

  return { error: null };
}

// ─── Write: Mark notification as read ────────────────────────────────────────
export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!IS_SUPABASE_CONFIGURED) return;

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() } as any)
    .eq('id', notificationId);
}

// ─── Write: Audit Log ─────────────────────────────────────────────────────────
export async function writeAuditLog(
  actorId: string,
  action: string,
  target: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!IS_SUPABASE_CONFIGURED) return;

  await supabase.from('audit_log').insert({
    actor_id: actorId,
    action,
    target,
    metadata,
  } as any);
}

// ─── Read: Dose Events History by date range ──────────────────────────────────
export async function fetchDoseEventRange(
  parentId: string,
  fromDate: string,
  toDate: string
): Promise<DoseEvent[]> {
  if (!IS_SUPABASE_CONFIGURED) return INITIAL_DOSE_EVENTS;

  const { data, error } = await supabase
    .from('dose_events')
    .select('*')
    .eq('parent_id', parentId)
    .gte('event_date', fromDate)
    .lte('event_date', toDate)
    .order('event_date', { ascending: false });

  if (error) { console.error('[CareBox] fetchDoseEventRange:', error); return []; }

  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    parentId: row.parent_id,
    slot: row.slot as Slot,
    eventDate: row.event_date,
    takenAt: new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    }).format(new Date(row.taken_at)),
    source: row.source as DoseEvent['source'],
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimeLocal(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Re-export schedules for mock access
export { INITIAL_PRIVACY_SETTINGS };
