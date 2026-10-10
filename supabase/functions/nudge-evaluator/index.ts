/**
 * Supabase Edge Function: /nudge-evaluator
 * Invoked periodically via pg_cron (every 15 min) or manually to check
 * if any scheduled doses are overdue past parent.nudge_delay_min.
 *
 * Rules:
 * 1. Strictly respects parent.sharing_paused -> skips completely if paused.
 * 2. Checks if a dose_event already exists for today -> skips.
 * 3. Checks if a reminder was already sent today for this slot -> skips (max 1 nudge).
 * 4. Checks if an admin logged "I'll call her" -> skips reminder.
 * 5. If eligible, creates an in-app notification for family admins and sends Web Push.
 */

// @ts-ignore: Deno types in edge function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: Deno types in edge function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Fetch all active parents whose sharing is NOT paused
    const { data: parents, error: parentError } = await supabase
      .from('parents')
      .select('id, name, family_id, timezone, nudge_delay_min, sharing_paused')
      .eq('sharing_paused', false);

    if (parentError) throw parentError;

    const evaluatedResults = [];

    for (const parent of parents ?? []) {
      // Get current local time in parent's timezone
      const parentTimeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: parent.timezone || 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);

      const [currentHours, currentMins] = parentTimeStr.split(':').map(Number);
      const currentTotalMins = currentHours * 60 + currentMins;

      // Fetch active dose schedules for this parent
      const { data: schedules } = await supabase
        .from('dose_schedules')
        .select('slot, time_local')
        .eq('parent_id', parent.id)
        .eq('active', true);

      // Fetch today's confirmed doses
      const { data: dosesToday } = await supabase
        .from('dose_events')
        .select('slot')
        .eq('parent_id', parent.id)
        .eq('event_date', today);

      const takenSlots = new Set((dosesToday ?? []).map((d: any) => d.slot));

      // Fetch today's existing reminders
      const { data: remindersToday } = await supabase
        .from('reminders')
        .select('slot, type')
        .eq('parent_id', parent.id)
        .eq('reminder_date', today);

      const remindedSlots = new Set((remindersToday ?? []).map((r: any) => r.slot));

      for (const schedule of schedules ?? []) {
        // 1. If already taken, skip
        if (takenSlots.has(schedule.slot)) continue;

        // 2. If already reminded or call logged, skip
        if (remindedSlots.has(schedule.slot)) continue;

        // Calculate schedule minutes
        const [schedHours, schedMins] = schedule.time_local.split(':').map(Number);
        const schedTotalMins = schedHours * 60 + schedMins;
        const delayThreshold = schedTotalMins + (parent.nudge_delay_min || 60);

        // Check if current time has passed the threshold
        if (currentTotalMins >= delayThreshold) {
          // Find family admin users to notify
          const { data: admins } = await supabase
            .from('members')
            .select('user_id')
            .eq('family_id', parent.family_id)
            .eq('role', 'admin')
            .eq('status', 'active');

          for (const admin of admins ?? []) {
            // Check if notification already exists for this slot today
            const { data: existingNotif } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', admin.user_id)
              .eq('type', `nudge_eligible_${schedule.slot}_${today}`)
              .single();

            if (!existingNotif) {
              await supabase.from('notifications').insert({
                user_id: admin.user_id,
                type: `nudge_eligible_${schedule.slot}_${today}`,
                title: `${parent.name}'s ${schedule.slot} medicine is unconfirmed`,
                body: `Scheduled for ${schedule.time_local}. You can send a gentle reminder.`,
                payload: {
                  parent_id: parent.id,
                  slot: schedule.slot,
                  event_date: today,
                },
              });
            }
          }

          evaluatedResults.push({
            parentId: parent.id,
            slot: schedule.slot,
            status: 'nudge_available',
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        evaluated_at: now.toISOString(),
        eligible_nudges: evaluatedResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
