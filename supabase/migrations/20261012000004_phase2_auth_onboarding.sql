-- ==============================================================================
-- CareBox Family — Phase 2 Migration: Real Auth, Profile Triggers & Onboarding
-- Migration: 20261012000004_phase2_auth_onboarding.sql
-- ==============================================================================

-- 1. Automatic Profile Creation on auth.users insert (Google OAuth & Magic Link)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Automatic Admin Membership on Family Creation
-- Fixes Chicken-and-Egg RLS hurdle: Family creator is immediately made active admin
CREATE OR REPLACE FUNCTION public.handle_new_family()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (family_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'admin', 'active')
  ON CONFLICT (family_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_family_created ON public.families;
CREATE TRIGGER on_family_created
  AFTER INSERT ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_family();

-- 3. Atomic Onboarding Stored Procedure
-- Handles role path: "I take medicines" (parent+owner) or "I care for someone" (caregiver admin)
CREATE OR REPLACE FUNCTION public.onboard_family(
  p_family_name TEXT,
  p_parent_name TEXT,
  p_user_role TEXT DEFAULT 'admin', -- 'parent' | 'admin'
  p_relation TEXT DEFAULT 'Mom'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
  v_parent_id UUID;
  v_box_id UUID;
  v_pairing_code TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create family
  INSERT INTO public.families (name, created_by)
  VALUES (p_family_name, v_user_id)
  RETURNING id INTO v_family_id;

  -- 2. Create parent profile
  INSERT INTO public.parents (
    family_id,
    name,
    photo_url,
    sharing_paused,
    timezone,
    nudge_delay_min
  )
  VALUES (
    v_family_id,
    p_parent_name,
    '/images/mom_avatar.jpg',
    false,
    'Asia/Kolkata',
    60
  )
  RETURNING id INTO v_parent_id;

  -- 3. Seed default dose schedules (Morning 08:00, Afternoon 14:00, Night 21:00)
  INSERT INTO public.dose_schedules (parent_id, slot, time_local, active)
  VALUES
    (v_parent_id, 'morning', '08:00:00', true),
    (v_parent_id, 'afternoon', '14:00:00', true),
    (v_parent_id, 'night', '21:00:00', true)
  ON CONFLICT (parent_id, slot) DO NOTHING;

  -- 4. Generate initial box record with pairing code
  v_pairing_code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
  INSERT INTO public.boxes (
    parent_id,
    device_token_hash,
    qr_code
  )
  VALUES (
    v_parent_id,
    crypt(v_pairing_code, gen_salt('bf')),
    v_pairing_code
  )
  RETURNING id INTO v_box_id;

  -- Return created entities
  RETURN jsonb_build_object(
    'family_id', v_family_id,
    'parent_id', v_parent_id,
    'box_id', v_box_id,
    'pairing_code', v_pairing_code,
    'role', p_user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.onboard_family(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 4. User Account Purge RPC (DPDP Act 2023 Right to Erasure)
-- Cascades user health records, consents, memberships, and user-owned families
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Log final audit trail before deletion
  INSERT INTO public.audit_log (actor_id, action, target, metadata)
  VALUES (v_user_id, 'account_deleted', v_user_id::text, jsonb_build_object('timestamp', now()));

  -- Delete consents
  DELETE FROM public.consents WHERE user_id = v_user_id;

  -- Delete push subscriptions
  DELETE FROM public.push_subscriptions WHERE user_id = v_user_id;

  -- Delete notifications
  DELETE FROM public.notifications WHERE user_id = v_user_id;

  -- Delete family memberships
  DELETE FROM public.members WHERE user_id = v_user_id;

  -- Delete families created solely by this user
  DELETE FROM public.families WHERE created_by = v_user_id;

  -- Delete profile
  DELETE FROM public.profiles WHERE id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
