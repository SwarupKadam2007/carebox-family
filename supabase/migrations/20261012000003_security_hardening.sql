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
