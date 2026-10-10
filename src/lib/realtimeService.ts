/**
 * Realtime service — manages Supabase Realtime channel subscriptions.
 * When a dose_event is inserted (box button pressed), the family app
 * receives the update instantly via WebSocket and updates state.
 * Falls back silently when Supabase is not configured.
 */
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { DoseEvent, Slot } from '../types';

export interface RealtimeCallbacks {
  /** Called when a dose event is confirmed (box button pressed) */
  onDoseConfirmed: (event: DoseEvent) => void;
  /** Called when parent's sharing_paused changes */
  onSharingPauseChanged: (paused: boolean) => void;
  /** Called when a new notification arrives (nudge available) */
  onNotificationReceived: (payload: {
    id: string;
    type: string;
    title: string;
    body: string | null;
  }) => void;
}

let doseChannel: RealtimeChannel | null = null;
let parentChannel: RealtimeChannel | null = null;
let notifChannel: RealtimeChannel | null = null;

/**
 * Subscribe to realtime updates for a specific parent.
 * Called once when the app authenticates and knows parentId/userId.
 */
export function subscribeToRealtimeUpdates(
  parentId: string,
  userId: string,
  callbacks: RealtimeCallbacks
): () => void {
  if (!IS_SUPABASE_CONFIGURED) {
    console.info('[CareBox] Realtime: Supabase not configured — using mock state only.');
    return () => {}; // no-op unsubscribe
  }

  // 1. Dose Events channel — fires when box button is pressed
  doseChannel = supabase
    .channel(`doses:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dose_events',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload) => {
        const row = payload.new as {
          id: string;
          parent_id: string;
          slot: string;
          event_date: string;
          taken_at: string;
          source: string;
        };
        const doseEvent: DoseEvent = {
          id: row.id,
          parentId: row.parent_id,
          slot: row.slot as Slot,
          eventDate: row.event_date,
          takenAt: new Intl.DateTimeFormat('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
          }).format(new Date(row.taken_at)),
          source: row.source as DoseEvent['source'],
        };
        callbacks.onDoseConfirmed(doseEvent);
      }
    )
    .subscribe((status) => {
      console.info('[CareBox] Dose channel status:', status);
    });

  // 2. Parent sharing_paused changes
  parentChannel = supabase
    .channel(`parent:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'parents',
        filter: `id=eq.${parentId}`,
      },
      (payload) => {
        const updated = payload.new as { sharing_paused: boolean };
        callbacks.onSharingPauseChanged(updated.sharing_paused);
      }
    )
    .subscribe();

  // 3. Notifications for this family member
  notifChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as {
          id: string;
          type: string;
          title: string;
          body: string | null;
        };
        callbacks.onNotificationReceived(row);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    if (doseChannel) supabase.removeChannel(doseChannel);
    if (parentChannel) supabase.removeChannel(parentChannel);
    if (notifChannel) supabase.removeChannel(notifChannel);
    doseChannel = null;
    parentChannel = null;
    notifChannel = null;
  };
}
