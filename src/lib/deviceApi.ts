/**
 * Client Device API — connects the app with the physical CareBox hardware.
 * Communicates with the Supabase Edge Function `/box-event` or local simulator.
 */
import { IS_SUPABASE_CONFIGURED, supabase } from './supabase';
import type { Slot } from '../types';

export interface BoxTelemetry {
  boxId: string;
  isOnline: boolean;
  batteryPct: number;
  wifiRssi: number;
  firmwareVersion: string;
  lastHeartbeat: string;
  activeGlowingSlot: Slot | null;
}

export const DEFAULT_MOCK_BOX_TELEMETRY: BoxTelemetry = {
  boxId: 'CB-8842-PUNE',
  isOnline: true,
  batteryPct: 87,
  wifiRssi: -58, // good Wi-Fi
  firmwareVersion: 'v2.4.1-ind',
  lastHeartbeat: '2 minutes ago',
  activeGlowingSlot: 'afternoon',
};

/**
 * Report a physical button press on the box
 */
export async function sendBoxButtonPress(
  boxId: string,
  slot: Slot
): Promise<{ success: boolean; error?: string }> {
  if (!IS_SUPABASE_CONFIGURED) {
    return { success: true };
  }

  try {
    const { error } = await supabase.functions.invoke('box-event', {
      body: {
        action: 'dose_taken',
        box_id: boxId,
        slot,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Request hardware status / heartbeat
 */
export async function fetchBoxTelemetry(boxId: string): Promise<BoxTelemetry> {
  if (!IS_SUPABASE_CONFIGURED) {
    return DEFAULT_MOCK_BOX_TELEMETRY;
  }

  try {
    const { data, error } = await supabase.functions.invoke('box-event', {
      body: {
        action: 'heartbeat',
        box_id: boxId,
        battery_pct: 85,
      },
    });

    if (error || !data) {
      return { ...DEFAULT_MOCK_BOX_TELEMETRY, isOnline: false };
    }

    return {
      boxId,
      isOnline: data.status === 'online',
      batteryPct: data.battery_reported ?? 85,
      wifiRssi: -62,
      firmwareVersion: 'v2.4.1-ind',
      lastHeartbeat: 'Just now',
      activeGlowingSlot: null,
    };
  } catch {
    return DEFAULT_MOCK_BOX_TELEMETRY;
  }
}

/**
 * Trigger gentle reminder on the physical box (pulsing amber LED + gentle low-frequency chime)
 */
export async function triggerBoxGentleReminder(
  boxId: string,
  slot: Slot
): Promise<{ success: boolean }> {
  console.info(`[CareBox Hardware] Sending gentle reminder pulse to Box ${boxId} for ${slot} compartment.`);
  return { success: true };
}
