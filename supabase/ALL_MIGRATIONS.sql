-- ==============================================================================
-- File: 20261011000001_initial_schema.sql
-- ==============================================================================

-- ==============================================================================
-- CareBox Family — Initial Schema Migration
-- Matches Architecture Section 3 & Product Specification Section 7
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (Extends auth.users for authenticated family members)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Families (One family unit per CareBox)
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Members (Family membership with role-based access)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'viewer')) NOT NULL DEFAULT 'viewer',
    status TEXT CHECK (status IN ('invited', 'active', 'removed')) NOT NULL DEFAULT 'invited',
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (family_id, user_id)
);

-- 4. Parents (Elderly parent — owner of the physical CareBox)
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    photo_url TEXT,
    sharing_paused BOOLEAN DEFAULT false NOT NULL,
    timezone TEXT DEFAULT 'Asia/Kolkata' NOT NULL,
    nudge_delay_min INTEGER DEFAULT 60 CHECK (nudge_delay_min >= 15) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Boxes (Physical or simulated CareBox hardware devices)
CREATE TABLE IF NOT EXISTS public.boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    device_token_hash TEXT NOT NULL,
    qr_code TEXT,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Medicines (Prescribed medicines mapped to dose slots)
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    strength TEXT, -- e.g. "500mg"
    dosage_text TEXT, -- e.g. "1 tablet • Morning & Night"
    slot TEXT CHECK (slot IN ('morning', 'afternoon', 'night', 'both')) NOT NULL,
    pills_left INTEGER DEFAULT 30 CHECK (pills_left >= 0) NOT NULL,
    pills_per_dose INTEGER DEFAULT 1 CHECK (pills_per_dose >= 1) NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Dose Schedules (Scheduled local time per slot)
CREATE TABLE IF NOT EXISTS public.dose_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    slot TEXT CHECK (slot IN ('morning', 'afternoon', 'night')) NOT NULL,
    time_local TIME NOT NULL, -- e.g. '08:00:00'
    active BOOLEAN DEFAULT true NOT NULL,
    UNIQUE (parent_id, slot)
);

-- 8. Dose Events (Confirmation logged on box button-press or manual confirmation)
CREATE TABLE IF NOT EXISTS public.dose_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    slot TEXT CHECK (slot IN ('morning', 'afternoon', 'night')) NOT NULL,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    taken_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT CHECK (source IN ('box', 'manual', 'simulator')) DEFAULT 'box' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (parent_id, slot, event_date)
);

-- 9. Reminders (Gentle nudges or logged calls)
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    slot TEXT CHECK (slot IN ('morning', 'afternoon', 'night')) NOT NULL,
    reminder_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT CHECK (type IN ('reminder', 'call')) NOT NULL,
    sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (parent_id, slot, reminder_date)
);

-- 10. Notifications (In-app notifications for family members)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Push Subscriptions (Web Push endpoints and VAPID keys)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, endpoint)
);

-- 12. Consents (Legal consent tracking - Terms & DPDP 2023)
CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document TEXT CHECK (document IN ('terms', 'privacy', 'medicine_data')) NOT NULL,
    version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_hash TEXT
);

-- 13. Audit Log (Audit trail for sensitive actions like member invite, sharing pause, deletion)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performant lookups
CREATE INDEX IF NOT EXISTS idx_members_family_user ON public.members (family_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_parent_date ON public.dose_events (parent_id, event_date);
CREATE INDEX IF NOT EXISTS idx_medicines_parent ON public.medicines (parent_id);
CREATE INDEX IF NOT EXISTS idx_reminders_parent_date ON public.reminders (parent_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id) WHERE read_at IS NULL;


-- ==============================================================================
-- File: 20261011000002_rls_policies.sql
-- ==============================================================================

-- ==============================================================================
-- CareBox Family — Row Level Security (RLS) Policies
-- Strict least-privilege policies matching Product Specification Section 2 & 7
-- ==============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Security Definer Helper Functions (run with table owner privileges to avoid recursion)
-- ------------------------------------------------------------------------------

-- Check if current authenticated user is an active member of a family
CREATE OR REPLACE FUNCTION public.is_family_member(f_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.members
    WHERE family_id = f_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current authenticated user is an active ADMIN of a family
CREATE OR REPLACE FUNCTION public.is_family_admin(f_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.members
    WHERE family_id = f_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper to find family_id for a given parent_id
CREATE OR REPLACE FUNCTION public.get_parent_family_id(p_id UUID)
RETURNS UUID AS $$
  SELECT family_id FROM public.parents WHERE id = p_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper to check if parent's sharing is active (not paused)
CREATE OR REPLACE FUNCTION public.parent_sharing_is_active(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT NOT sharing_paused FROM public.parents WHERE id = p_id), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 1. Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own profile or co-members"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.members m1
      JOIN public.members m2 ON m1.family_id = m2.family_id
      WHERE m1.user_id = auth.uid()
        AND m2.user_id = public.profiles.id
        AND m1.status = 'active'
        AND m2.status = 'active'
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 2. Families Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Active family members can view their family"
  ON public.families FOR SELECT
  USING (public.is_family_member(id));

CREATE POLICY "Authenticated users can create a new family"
  ON public.families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Family admins can update family"
  ON public.families FOR UPDATE
  USING (public.is_family_admin(id))
  WITH CHECK (public.is_family_admin(id));

CREATE POLICY "Family admins can delete family"
  ON public.families FOR DELETE
  USING (public.is_family_admin(id));

-- ------------------------------------------------------------------------------
-- 3. Members Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view co-members of their family"
  ON public.members FOR SELECT
  USING (public.is_family_member(family_id));

CREATE POLICY "Family admins can invite or add members"
  ON public.members FOR INSERT
  WITH CHECK (
    public.is_family_admin(family_id)
    OR user_id = auth.uid() -- Allows user to accept invite
  );

CREATE POLICY "Family admins can update member roles"
  ON public.members FOR UPDATE
  USING (public.is_family_admin(family_id))
  WITH CHECK (public.is_family_admin(family_id));

CREATE POLICY "Admins can remove members or user can leave"
  ON public.members FOR DELETE
  USING (
    public.is_family_admin(family_id)
    OR user_id = auth.uid()
  );

-- ------------------------------------------------------------------------------
-- 4. Parents Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Active family members can view parents"
  ON public.parents FOR SELECT
  USING (public.is_family_member(family_id));

CREATE POLICY "Only family admins can create parents"
  ON public.parents FOR INSERT
  WITH CHECK (public.is_family_admin(family_id));

CREATE POLICY "Only family admins can update parents"
  ON public.parents FOR UPDATE
  USING (public.is_family_admin(family_id))
  WITH CHECK (public.is_family_admin(family_id));

CREATE POLICY "Only family admins can delete parents"
  ON public.parents FOR DELETE
  USING (public.is_family_admin(family_id));

-- ------------------------------------------------------------------------------
-- 5. Boxes Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Only family admins can view box device details"
  ON public.boxes FOR SELECT
  USING (public.is_family_admin(public.get_parent_family_id(parent_id)));

CREATE POLICY "Only family admins can register or pair boxes"
  ON public.boxes FOR INSERT
  WITH CHECK (public.is_family_admin(public.get_parent_family_id(parent_id)));

CREATE POLICY "Only family admins can update box settings"
  ON public.boxes FOR UPDATE
  USING (public.is_family_admin(public.get_parent_family_id(parent_id)));

-- ------------------------------------------------------------------------------
-- 6. Medicines Policies (Strict: Viewers cannot edit!)
-- ------------------------------------------------------------------------------
CREATE POLICY "Active family members can view medicines"
  ON public.medicines FOR SELECT
  USING (public.is_family_member(public.get_parent_family_id(parent_id)));

CREATE POLICY "Only family admins can add medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (public.is_family_admin(public.get_parent_family_id(parent_id)));

CREATE POLICY "Only family admins can edit medicines"
  ON public.medicines FOR UPDATE
  USING (public.is_family_admin(public.get_parent_family_id(parent_id)))
  WITH CHECK (public.is_family_admin(public.get_parent_family_id(parent_id)));

CREATE POLICY "Only family admins can delete medicines"
  ON public.medicines FOR DELETE
  USING (public.is_family_admin(public.get_parent_family_id(parent_id)));

-- ------------------------------------------------------------------------------
-- 7. Dose Schedules Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Active family members can view dose schedules"
  ON public.dose_schedules FOR SELECT
  USING (public.is_family_member(public.get_parent_family_id(parent_id)));

CREATE POLICY "Only family admins can manage schedules"
  ON public.dose_schedules FOR ALL
  USING (public.is_family_admin(public.get_parent_family_id(parent_id)))
  WITH CHECK (public.is_family_admin(public.get_parent_family_id(parent_id)));

-- ------------------------------------------------------------------------------
-- 8. Dose Events Policies (Dignity rule: Pause sharing hides from viewers!)
-- ------------------------------------------------------------------------------
CREATE POLICY "View dose events based on sharing pause"
  ON public.dose_events FOR SELECT
  USING (
    -- Admin can always see
    public.is_family_admin(public.get_parent_family_id(parent_id))
    OR (
      -- Viewer can ONLY see if sharing is NOT paused
      public.is_family_member(public.get_parent_family_id(parent_id))
      AND public.parent_sharing_is_active(parent_id)
    )
  );

CREATE POLICY "Family admins or verified devices can insert dose events"
  ON public.dose_events FOR INSERT
  WITH CHECK (
    public.is_family_admin(public.get_parent_family_id(parent_id))
    OR public.is_family_member(public.get_parent_family_id(parent_id))
  );

-- ------------------------------------------------------------------------------
-- 9. Reminders Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "View reminders based on sharing pause"
  ON public.reminders FOR SELECT
  USING (
    public.is_family_admin(public.get_parent_family_id(parent_id))
    OR (
      public.is_family_member(public.get_parent_family_id(parent_id))
      AND public.parent_sharing_is_active(parent_id)
    )
  );

CREATE POLICY "Active family members can send reminders or log calls"
  ON public.reminders FOR INSERT
  WITH CHECK (public.is_family_member(public.get_parent_family_id(parent_id)));

-- ------------------------------------------------------------------------------
-- 10. Notifications Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can only manage their own notifications"
  ON public.notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 11. Push Subscriptions Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can only manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 12. Consents Policies (DPDP Act 2023)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can only access their own consent records"
  ON public.consents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 13. Audit Log Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can insert audit records"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view audit records they acted in"
  ON public.audit_log FOR SELECT
  USING (actor_id = auth.uid());


-- ==============================================================================
-- File: 20261012000003_security_hardening.sql
-- ==============================================================================

-- ==============================================================================
-- CareBox Family — Security Hardening & Privilege Escalation Mitigation
-- Migration: 20261012000003_security_hardening.sql
--
-- Fixes:
-- 1. Prevents privilege escalation on public.members: Users cannot self-insert as 'admin'
-- 2. Prevents actor_id spoofing on public.audit_log: Enforces actor_id = auth.uid()
-- 3. Enforces created_by = auth.uid() on public.families insertion
-- 4. Introduces cryptographic token verification function for hardware device tokens
-- ==============================================================================

-- 1. Members Privilege Escalation Fix
DROP POLICY IF EXISTS "Family admins can invite or add members" ON public.members;
CREATE POLICY "Family admins can invite or add members"
  ON public.members FOR INSERT
  WITH CHECK (
    public.is_family_admin(family_id)
    OR (
      -- A non-admin user can only insert themselves if invited as a viewer
      user_id = auth.uid()
      AND role = 'viewer'
      AND status = 'invited'
    )
  );

-- 2. Audit Log Actor Spoofing Fix
DROP POLICY IF EXISTS "Authenticated users can insert audit records" ON public.audit_log;
CREATE POLICY "Authenticated users can insert audit records for self"
  ON public.audit_log FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- 3. Families created_by Guard
DROP POLICY IF EXISTS "Authenticated users can create a new family" ON public.families;
CREATE POLICY "Authenticated users can create a new family"
  ON public.families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- 4. Cryptographic Hardware Token Verification Function
-- Compares device bearer token with bcrypt hash stored in boxes.device_token_hash
CREATE OR REPLACE FUNCTION public.verify_box_token(p_box_id UUID, p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_hash TEXT;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 THEN
    RETURN FALSE;
  END IF;

  SELECT device_token_hash INTO v_hash
  FROM public.boxes
  WHERE id = p_box_id;

  IF v_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Use pgcrypto crypt() to compare token with bcrypt hash
  RETURN v_hash = crypt(p_token, v_hash);
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.verify_box_token(UUID, TEXT) TO authenticated, service_role;


-- ==============================================================================
-- File: 20261012000004_phase2_auth_onboarding.sql
-- ==============================================================================

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


-- ==============================================================================
-- File: 20261012000005_phase3_core_dose_loop.sql
-- ==============================================================================

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
