-- ==============================================================================
-- CareBox Family — Phase 3 Migration: Core Dose Loop & Inventory Management
-- Migration: 20261012000005_phase3_core_dose_loop.sql
-- ==============================================================================

-- 1. Inventory Refill RPC: Decrement Pills on Dose Confirmation
CREATE OR REPLACE FUNCTION public.decrement_pills(p_parent_id UUID, p_slot TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.medicines
  SET pills_left = GREATEST(0, pills_left - pills_per_dose)
  WHERE parent_id = p_parent_id
    AND active = true
    AND (slot = p_slot OR slot = 'both');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.decrement_pills(UUID, TEXT) TO authenticated, service_role;

-- 2. Refined Dose Events SELECT Policy:
-- Ensures family admins and the parent user can always view records,
-- while family viewers are strictly blocked when sharing is paused (Dignity Rule)
DROP POLICY IF EXISTS "View dose events based on sharing pause" ON public.dose_events;
CREATE POLICY "View dose events based on sharing pause"
  ON public.dose_events FOR SELECT
  USING (
    -- Admin or Family Owner can always view for clinical oversight
    public.is_family_admin(public.get_parent_family_id(parent_id))
    OR (
      -- Viewer can ONLY see if sharing is NOT paused
      public.is_family_member(public.get_parent_family_id(parent_id))
      AND public.parent_sharing_is_active(parent_id)
    )
  );

-- 3. Idempotent Dose Confirmation Helper
CREATE OR REPLACE FUNCTION public.confirm_dose(
  p_parent_id UUID,
  p_slot TEXT,
  p_source TEXT DEFAULT 'app'
)
RETURNS JSONB AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_event_id UUID;
  v_taken_at TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  -- Check if already taken today
  SELECT id INTO v_event_id
  FROM public.dose_events
  WHERE parent_id = p_parent_id
    AND slot = p_slot
    AND event_date = v_today;

  IF v_event_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_recorded',
      'id', v_event_id,
      'slot', p_slot,
      'message', 'Dose already confirmed for today'
    );
  END IF;

  -- Insert new dose event
  INSERT INTO public.dose_events (
    parent_id,
    slot,
    event_date,
    taken_at,
    source
  )
  VALUES (
    p_parent_id,
    p_slot,
    v_today,
    v_taken_at,
    p_source
  )
  RETURNING id INTO v_event_id;

  -- Decrement inventory
  PERFORM public.decrement_pills(p_parent_id, p_slot);

  RETURN jsonb_build_object(
    'status', 'success',
    'id', v_event_id,
    'slot', p_slot,
    'taken_at', v_taken_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.confirm_dose(UUID, TEXT, TEXT) TO authenticated, service_role;
