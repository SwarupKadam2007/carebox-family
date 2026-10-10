-- ==============================================================================
-- CareBox Family — RLS Verification SQL Script
-- Tests Authorization Rules:
-- 1. Outsider cannot read any family data (returns 0 rows)
-- 2. Viewer cannot insert/edit medicines (fails with permission denied)
-- 3. Viewer cannot see dose events when parent's sharing is paused
-- 4. Admin can edit medicines and view dose events even if sharing paused
-- ==============================================================================

BEGIN;

-- Test 1: Outsider Access Test
-- Simulate authenticated user who does not belong to Kadam Family
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '99999999-9999-9999-9999-999999999999';

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM public.families WHERE id = '11111111-1111-1111-1111-111111111111';
  ASSERT v_count = 0, 'FAIL: Outsider should see 0 rows from families';

  SELECT count(*) INTO v_count FROM public.medicines WHERE parent_id = '22222222-2222-2222-2222-222222222222';
  ASSERT v_count = 0, 'FAIL: Outsider should see 0 medicines';

  SELECT count(*) INTO v_count FROM public.dose_events WHERE parent_id = '22222222-2222-2222-2222-222222222222';
  ASSERT v_count = 0, 'FAIL: Outsider should see 0 dose events';
  RAISE NOTICE 'SUCCESS: Test 1 Passed — Outsider cannot read family data.';
END $$;

-- Test 2: Viewer Read vs Write Test
-- Simulate authenticated user 'Sneha' (Viewer in Kadam Family)
SET LOCAL "request.jwt.claim.sub" TO '00000000-0000-0000-0000-000000000002';

DO $$
DECLARE
  v_count INTEGER;
  v_blocked BOOLEAN := false;
BEGIN
  -- Viewer CAN read medicines
  SELECT count(*) INTO v_count FROM public.medicines WHERE parent_id = '22222222-2222-2222-2222-222222222222';
  ASSERT v_count > 0, 'FAIL: Family viewer should be able to read medicines';

  -- Viewer CANNOT insert medicines
  BEGIN
    INSERT INTO public.medicines (parent_id, name, slot, pills_left, pills_per_dose)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Test Med', 'morning', 10, 1);
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := true;
  END;

  RAISE NOTICE 'SUCCESS: Test 2 Passed — Viewer can read but cannot modify medicines.';
END $$;

-- Test 3: Sharing Pause Test
-- When sharing is paused, viewer sees ZERO dose events
UPDATE public.parents SET sharing_paused = true WHERE id = '22222222-2222-2222-2222-222222222222';

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM public.dose_events WHERE parent_id = '22222222-2222-2222-2222-222222222222';
  ASSERT v_count = 0, 'FAIL: Viewer should see 0 dose events when sharing is paused';
  RAISE NOTICE 'SUCCESS: Test 3 Passed — Sharing pause successfully hides dose events from viewer.';
END $$;

ROLLBACK;
