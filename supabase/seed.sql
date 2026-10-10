-- ==============================================================================
-- CareBox Family — Demo Seed Data
-- Matches the approved UI layout and realistic Indian family demo scenario
-- ==============================================================================

-- 1. Seed deterministic UUID constants for demo data
DO $$
DECLARE
  v_user_admin_id UUID := '00000000-0000-0000-0000-000000000001';
  v_user_viewer_id UUID := '00000000-0000-0000-0000-000000000002';
  v_user_spouse_id UUID := '00000000-0000-0000-0000-000000000003';
  v_family_id     UUID := '11111111-1111-1111-1111-111111111111';
  v_parent_id     UUID := '22222222-2222-2222-2222-222222222222';
  v_box_id        UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- Insert dummy auth users if auth.users table is available in local Supabase
  BEGIN
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES
      (v_user_admin_id, 'swarup@carebox.family', '{"name": "Swarup Kadam"}'::jsonb),
      (v_user_viewer_id, 'sneha@carebox.family', '{"name": "Sneha Kadam"}'::jsonb),
      (v_user_spouse_id, 'dad@carebox.family', '{"name": "Dad"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- If running in an environment without auth.users, ignore
      NULL;
  END;

  -- 2. Profiles
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES
    (v_user_admin_id, 'Swarup Kadam', NULL),
    (v_user_viewer_id, 'Sneha Kadam', NULL),
    (v_user_spouse_id, 'Dad', NULL)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- 3. Family
  INSERT INTO public.families (id, name, created_by)
  VALUES (v_family_id, 'Kadam Family', v_user_admin_id)
  ON CONFLICT (id) DO NOTHING;

  -- 4. Members
  INSERT INTO public.members (family_id, user_id, role, status, invited_by)
  VALUES
    (v_family_id, v_user_admin_id, 'admin', 'active', NULL),
    (v_family_id, v_user_viewer_id, 'viewer', 'active', v_user_admin_id),
    (v_family_id, v_user_spouse_id, 'viewer', 'active', v_user_admin_id)
  ON CONFLICT (family_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;

  -- 5. Parent (Mom)
  INSERT INTO public.parents (id, family_id, name, photo_url, sharing_paused, timezone, nudge_delay_min)
  VALUES
    (v_parent_id, v_family_id, 'Mom (Kalyani Kadam)', '/images/mom_avatar.jpg', false, 'Asia/Kolkata', 60)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    photo_url = EXCLUDED.photo_url,
    sharing_paused = EXCLUDED.sharing_paused;

  -- 6. Box Device
  -- Device bearer token: "cb_dev_secret_token_8842"
  -- bcrypt hash generated for testing:
  INSERT INTO public.boxes (id, parent_id, device_token_hash, qr_code, last_seen)
  VALUES
    (v_box_id, v_parent_id, crypt('cb_dev_secret_token_8842', gen_salt('bf')), 'CAREBOX-PUNE-8842', now())
  ON CONFLICT (id) DO NOTHING;

  -- 7. Dose Schedules
  INSERT INTO public.dose_schedules (parent_id, slot, time_local)
  VALUES
    (v_parent_id, 'morning', '08:00:00'),
    (v_parent_id, 'afternoon', '14:00:00'),
    (v_parent_id, 'night', '21:00:00')
  ON CONFLICT (parent_id, slot) DO UPDATE SET time_local = EXCLUDED.time_local;

  -- 8. Medicines matching the approved UI layout
  INSERT INTO public.medicines (parent_id, name, strength, dosage_text, slot, pills_left, pills_per_dose)
  VALUES
    (v_parent_id, 'Metformin 500mg', '500mg', '1 tablet • Morning & Night', 'both', 8, 2),
    (v_parent_id, 'Atorvastatin 10mg', '10mg', '1 tablet • Night', 'night', 12, 1),
    (v_parent_id, 'Vitamin D3 1000 IU', '1000 IU', '1 capsule • Morning', 'morning', 20, 1),
    (v_parent_id, 'Calcium + D3', '500mg', '1 tablet • Night', 'night', 18, 1)
  ON CONFLICT DO NOTHING;

  -- 9. Dose Event: Morning taken at 8:05 AM today
  INSERT INTO public.dose_events (parent_id, slot, event_date, taken_at, source)
  VALUES
    (v_parent_id, 'morning', CURRENT_DATE, CURRENT_DATE + TIME '08:05:00', 'box')
  ON CONFLICT (parent_id, slot, event_date) DO NOTHING;

  -- 10. Consents (Terms & Privacy DPDP 2023)
  INSERT INTO public.consents (user_id, document, version, ip_hash)
  VALUES
    (v_user_admin_id, 'terms', '1.0.0', 'sha256_mock_hash'),
    (v_user_admin_id, 'privacy', '1.0.0', 'sha256_mock_hash'),
    (v_user_admin_id, 'medicine_data', '1.0.0', 'sha256_mock_hash')
  ON CONFLICT DO NOTHING;

END $$;
