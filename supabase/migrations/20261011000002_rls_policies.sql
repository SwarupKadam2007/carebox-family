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
