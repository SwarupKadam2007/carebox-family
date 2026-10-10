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
