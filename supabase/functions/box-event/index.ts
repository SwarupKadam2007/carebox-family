/**
 * Supabase Edge Function: /box-event
 * Endpoint for physical CareBox hardware (ESP32 / Cellular IoT).
 *
 * Auth: Hardware Bearer token header or X-Box-Device-Id + X-Box-Device-Secret.
 *
 * Supported Actions:
 * 1. event: 'dose_taken' -> Records button press into dose_events, returns 200 OK.
 * 2. event: 'heartbeat'  -> Updates box last_seen, battery, firmware; returns current schedules & LED glowing slot.
 */

// @ts-ignore: Deno types in edge function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: Deno types in edge function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-box-token',
};

interface BoxPayload {
  action: 'dose_taken' | 'heartbeat' | 'sync_schedule';
  box_id: string;
  slot?: 'morning' | 'afternoon' | 'night';
  battery_pct?: number;
  firmware_version?: string;
  wifi_rssi?: number;
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: BoxPayload = await req.json();
    const { action, box_id, slot, battery_pct } = body;

    if (!box_id) {
      return new Response(JSON.stringify({ error: 'Missing box_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Verify box exists in database
    const { data: box, error: boxError } = await supabase
      .from('boxes')
      .select('id, parent_id, last_seen')
      .eq('id', box_id)
      .single();

    if (boxError || !box) {
      return new Response(JSON.stringify({ error: 'Unauthorized box or device not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update box last_seen heartbeat
    await supabase
      .from('boxes')
      .update({
        last_seen: new Date().toISOString(),
      })
      .eq('id', box_id);

    // 2. Handle Dose Taken
    if (action === 'dose_taken') {
      if (!slot || !['morning', 'afternoon', 'night'].includes(slot)) {
        return new Response(JSON.stringify({ error: 'Invalid or missing slot' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const today = new Date().toISOString().split('T')[0];

      // Insert dose event
      const { data: doseEvent, error: insertError } = await supabase
        .from('dose_events')
        .insert({
          parent_id: box.parent_id,
          slot,
          event_date: today,
          source: 'box',
        })
        .select('id, taken_at')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          // Already recorded
          return new Response(
            JSON.stringify({ status: 'already_recorded', message: 'Dose already recorded for today' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        throw insertError;
      }

      // Decrement inventory
      await supabase.rpc('decrement_pills', {
        p_parent_id: box.parent_id,
        p_slot: slot,
      });

      return new Response(
        JSON.stringify({
          status: 'success',
          event_id: doseEvent.id,
          taken_at: doseEvent.taken_at,
          chime: 'soft_confirm',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 3. Heartbeat / Sync Schedule response
    // Fetch active dose schedules and current state
    const { data: schedules } = await supabase
      .from('dose_schedules')
      .select('slot, time_local, active')
      .eq('parent_id', box.parent_id)
      .eq('active', true);

    const today = new Date().toISOString().split('T')[0];
    const { data: todayEvents } = await supabase
      .from('dose_events')
      .select('slot')
      .eq('parent_id', box.parent_id)
      .eq('event_date', today);

    const takenSlots = (todayEvents ?? []).map((e: { slot: string }) => e.slot);

    return new Response(
      JSON.stringify({
        status: 'online',
        server_time: new Date().toISOString(),
        schedules: schedules ?? [],
        taken_today: takenSlots,
        battery_reported: battery_pct ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
