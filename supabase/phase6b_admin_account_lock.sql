-- GoCost: restore the original ADMIN account, lock its role, and allow login-name changes.
-- Run as database owner in the GoCost project's SQL Editor. Apply before the UI update.
-- Keeps the existing password, names, internal user id, and all historical references.
-- Re-running is safe. No financial/report tables or functions are changed.
BEGIN;
SET LOCAL search_path = public, extensions, pg_temp;
LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = 'ADMIN') THEN
    RAISE EXCEPTION 'Original ADMIN account was not found; no changes applied';
  END IF;
END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_locked boolean NOT NULL DEFAULT false;
UPDATE public.users SET login_name = id WHERE login_name IS NULL;
ALTER TABLE public.users ALTER COLUMN login_name SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_login_name_unique ON public.users (lower(btrim(login_name)));

-- Only restore the requested original account; do not overwrite its profile or password.
UPDATE public.users SET role = 'ADMIN', role_locked = true WHERE id = 'ADMIN';

CREATE OR REPLACE FUNCTION public.guard_user_account()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role_locked THEN
      RAISE EXCEPTION 'ไม่สามารถลบบัญชีผู้ดูแลระบบที่ล็อกไว้ได้';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role_locked AND (
      NEW.role IS DISTINCT FROM 'ADMIN' OR NEW.role_locked IS DISTINCT FROM true
      OR NEW.id IS DISTINCT FROM OLD.id
    ) THEN
      RAISE EXCEPTION 'บัญชีนี้ล็อกบทบาท ADMIN ไว้ เปลี่ยนได้เฉพาะข้อมูลและชื่อเข้าสู่ระบบหรือรหัสผ่าน';
    END IF;
  END IF;
  IF NEW.role_locked AND NEW.role IS DISTINCT FROM 'ADMIN' THEN
    RAISE EXCEPTION 'บัญชีที่ล็อกบทบาทต้องเป็น ADMIN';
  END IF;
  NEW.login_name := btrim(coalesce(NEW.login_name, NEW.id));
  IF NEW.login_name = '' THEN
    RAISE EXCEPTION 'กรุณากรอกชื่อผู้ใช้สำหรับเข้าสู่ระบบ';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_user_account() FROM PUBLIC;
DROP TRIGGER IF EXISTS guard_user_account ON public.users;
CREATE TRIGGER guard_user_account BEFORE INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.guard_user_account();

-- Preserve the original RPC return contract and stable user id used by the whole app.
CREATE OR REPLACE FUNCTION public.login_user(p_id text, p_password text)
RETURNS TABLE (id text, role text, name text, full_name text, email text, page_permissions jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp AS $$
BEGIN
  RETURN QUERY SELECT u.id, u.role, u.name, u.full_name, u.email, u.page_permissions
  FROM public.users u
  WHERE lower(btrim(u.login_name)) = lower(btrim(p_id))
    AND u.password_hash = crypt(p_password, u.password_hash);
END $$;

-- Separate versioned RPC so older app versions continue to use get_users unchanged.
CREATE OR REPLACE FUNCTION public.get_users_for_management_v2(p_actor_id text)
RETURNS TABLE (id text, role text, name text, full_name text, email text,
  page_permissions jsonb, created_at timestamptz, login_name text, role_locked boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.has_page_permission(p_actor_id, 'users') THEN
    RAISE EXCEPTION 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน';
  END IF;
  RETURN QUERY SELECT u.id, u.role, u.name, u.full_name, u.email,
    u.page_permissions, u.created_at, u.login_name, u.role_locked
    FROM public.users u ORDER BY u.created_at DESC;
END $$;

-- Credential changes always verify the current password. Never change user id or role.
CREATE OR REPLACE FUNCTION public.update_my_credentials(
  p_user_id text, p_current_password text, p_login_name text, p_new_password text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp AS $$
DECLARE v_user public.users%ROWTYPE; v_login text := btrim(p_login_name);
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR coalesce(p_current_password, '') = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
  END IF;
  IF v_user.password_hash IS DISTINCT FROM crypt(p_current_password, v_user.password_hash) THEN
    RETURN jsonb_build_object('success', false, 'message', 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
  END IF;
  IF coalesce(v_login, '') = '' OR char_length(v_login) > 100 THEN
    RETURN jsonb_build_object('success', false, 'message', 'ชื่อผู้ใช้ต้องมีความยาว 1–100 ตัวอักษร');
  END IF;
  IF p_new_password IS NOT NULL AND (btrim(p_new_password) = '' OR octet_length(p_new_password) > 72) THEN
    RETURN jsonb_build_object('success', false, 'message', 'รหัสผ่านใหม่ต้องไม่ว่างและมีขนาดไม่เกิน 72 ไบต์');
  END IF;
  UPDATE public.users SET login_name = v_login,
    password_hash = CASE WHEN p_new_password IS NULL THEN password_hash
      ELSE crypt(p_new_password, gen_salt('bf')) END
    WHERE users.id = p_user_id;
  PERFORM public.write_audit_log(p_user_id, 'UPDATE_CREDENTIALS', 'User', 'เปลี่ยนข้อมูลเข้าสู่ระบบของตนเอง');
  RETURN jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลเข้าสู่ระบบแล้ว', 'login_name', v_login);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'message', 'ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น');
END $$;

REVOKE ALL ON FUNCTION public.get_users_for_management_v2(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_my_credentials(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_for_management_v2(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_credentials(text, text, text, text) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
SELECT id, role, role_locked, login_name FROM public.users WHERE id = 'ADMIN';
COMMIT;
