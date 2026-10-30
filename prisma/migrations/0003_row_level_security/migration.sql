-- Row Level Security baseline for the BMS schema.
--
-- Supabase's "automatic RLS" switch only covers tables created through the
-- dashboard / Data API. Prisma creates tables through migrations, so every
-- table here is granted explicitly, has RLS enabled and carries one policy per
-- operation.
--
-- Identity  : `profiles.id` is the JWT `sub` claim of the caller.
-- Tenant key: `profiles.buildingId` scopes every other table.
-- Roles     : ADMIN sees every building, USER sees only its own.
--
-- The Data API (`anon` / `authenticated`) is read-only. Writes go through the
-- server, which connects as `app_user` inside a transaction that carries the
-- caller's claims — see src/lib/db/tenant.ts.

DO $$
BEGIN
  IF to_regclass('public."Unit"') IS NULL OR to_regclass('public."profiles"') IS NULL THEN
    RAISE EXCEPTION
      'The application tables are missing. Restore the full schema first (prisma migrate deploy, or prisma db push), then apply this migration.';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN NOINHERIT;
  END IF;
END
$$;

DO $$
BEGIN
  EXECUTE format('GRANT app_user TO %I', current_user);
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;

-- ---------------------------------------------------------------- helpers --

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;

GRANT USAGE ON SCHEMA private TO authenticated, app_user;

-- Reads the caller identity from the request claims. `request.jwt.claims` is
-- what PostgREST sets for the Data API and what the server sets for Prisma;
-- `request.jwt.claim.sub` is the legacy single-claim form.
CREATE OR REPLACE FUNCTION private.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION private.current_profile()
RETURNS TABLE (id uuid, role text, building_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.role::text, p."buildingId"
  FROM public.profiles p
  WHERE p.id = private.current_user_id()
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT p.role = 'ADMIN' FROM public.profiles p WHERE p.id = private.current_user_id()),
    false
  )
$$;

CREATE OR REPLACE FUNCTION private.current_building_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT p."buildingId" FROM public.profiles p WHERE p.id = private.current_user_id())
$$;

REVOKE ALL ON FUNCTION private.current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_building_id() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.current_user_id() TO authenticated, app_user;
GRANT EXECUTE ON FUNCTION private.current_profile() TO authenticated, app_user;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, app_user;
GRANT EXECUTE ON FUNCTION private.current_building_id() TO authenticated, app_user;

-- ----------------------------------------------------------------- grants --

REVOKE ALL ON TABLE
  public."Building",
  public."profiles",
  public."Unit",
  public."Revenue",
  public."Expense",
  public."UtilityBill",
  public."Contract"
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public."Building",
  public."profiles",
  public."Unit",
  public."Revenue",
  public."Expense",
  public."UtilityBill",
  public."Contract"
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public."Building",
  public."profiles",
  public."Unit",
  public."Revenue",
  public."Expense",
  public."UtilityBill",
  public."Contract"
TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

-- -------------------------------------------------------------------- RLS --

ALTER TABLE public."Building" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Unit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Revenue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UtilityBill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Contract" ENABLE ROW LEVEL SECURITY;

-- Buildings: a user reads its own association, an admin reads all.
CREATE POLICY "building_read" ON public."Building"
  FOR SELECT TO authenticated, app_user
  USING ((SELECT private.is_admin()) OR id = (SELECT private.current_building_id()));

CREATE POLICY "building_insert" ON public."Building"
  FOR INSERT TO app_user
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "building_update" ON public."Building"
  FOR UPDATE TO app_user
  USING ((SELECT private.is_admin()) OR id = (SELECT private.current_building_id()))
  WITH CHECK ((SELECT private.is_admin()) OR id = (SELECT private.current_building_id()));

CREATE POLICY "building_delete" ON public."Building"
  FOR DELETE TO app_user
  USING ((SELECT private.is_admin()));

-- Profiles: a user reads and edits itself, an admin reads and edits everyone.
CREATE POLICY "profile_read_own" ON public."profiles"
  FOR SELECT TO authenticated, app_user
  USING (id = (SELECT private.current_user_id()));

CREATE POLICY "profile_read_admin" ON public."profiles"
  FOR SELECT TO authenticated, app_user
  USING ((SELECT private.is_admin()));

-- A user may only create its own profile and only with the USER role; an admin
-- may create any profile with any role.
CREATE POLICY "profile_insert" ON public."profiles"
  FOR INSERT TO app_user
  WITH CHECK (
    (
      id = (SELECT private.current_user_id())
      AND role = 'USER'
      AND "buildingId" IS NOT DISTINCT FROM (SELECT private.current_building_id())
    )
    OR (SELECT private.is_admin())
  );

-- Same rule for updates: a user cannot promote itself to ADMIN and cannot
-- move itself to another building.
CREATE POLICY "profile_update" ON public."profiles"
  FOR UPDATE TO app_user
  USING ((SELECT private.is_admin()) OR id = (SELECT private.current_user_id()))
  WITH CHECK (
    (
      id = (SELECT private.current_user_id())
      AND role = 'USER'
      AND "buildingId" IS NOT DISTINCT FROM (SELECT private.current_building_id())
    )
    OR (SELECT private.is_admin())
  );

CREATE POLICY "profile_delete" ON public."profiles"
  FOR DELETE TO app_user
  USING ((SELECT private.is_admin()));

-- Tenant tables: every row is reachable only through its building.
CREATE POLICY "tenant_read" ON public."Unit"
  FOR SELECT TO authenticated, app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_insert" ON public."Unit"
  FOR INSERT TO app_user
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_update" ON public."Unit"
  FOR UPDATE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()))
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_delete" ON public."Unit"
  FOR DELETE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_read" ON public."Revenue"
  FOR SELECT TO authenticated, app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_insert" ON public."Revenue"
  FOR INSERT TO app_user
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_update" ON public."Revenue"
  FOR UPDATE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()))
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_delete" ON public."Revenue"
  FOR DELETE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_read" ON public."Expense"
  FOR SELECT TO authenticated, app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_insert" ON public."Expense"
  FOR INSERT TO app_user
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_update" ON public."Expense"
  FOR UPDATE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()))
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_delete" ON public."Expense"
  FOR DELETE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_read" ON public."UtilityBill"
  FOR SELECT TO authenticated, app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_insert" ON public."UtilityBill"
  FOR INSERT TO app_user
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_update" ON public."UtilityBill"
  FOR UPDATE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()))
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_delete" ON public."UtilityBill"
  FOR DELETE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_read" ON public."Contract"
  FOR SELECT TO authenticated, app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_insert" ON public."Contract"
  FOR INSERT TO app_user
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_update" ON public."Contract"
  FOR UPDATE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()))
  WITH CHECK ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

CREATE POLICY "tenant_delete" ON public."Contract"
  FOR DELETE TO app_user
  USING ((SELECT private.is_admin()) OR "buildingId" = (SELECT private.current_building_id()));

-- ------------------------------------------------------- automatic RLS on --

-- Mirrors the Supabase project setting for tables Prisma creates later: a new
-- public table is locked down immediately and stays locked until it gets a
-- policy.
CREATE OR REPLACE FUNCTION private.enable_rls_on_public_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target text;
BEGIN
  FOR target IN
    SELECT object_identity
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type = 'table'
      AND schema_name = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target);
  END LOOP;
END
$$;

-- The trigger only fires for table creation, which also keeps it from
-- re-entering itself: the ALTER TABLE it runs is not a CREATE TABLE.
DROP EVENT TRIGGER IF EXISTS on_public_table_create;

CREATE EVENT TRIGGER on_public_table_create
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION private.enable_rls_on_public_table();

-- ------------------------------------------------- Supabase Auth bridging --

-- When the project moves to Supabase Auth, every auth user gets a profile row
-- whose id is the auth user id, so `auth.uid()` and the policies agree.
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION private.handle_new_auth_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $fn$
      BEGIN
        BEGIN
          INSERT INTO public.profiles (id, email, name, role, "createdAt", "updatedAt")
          VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data ->> 'full_name', new.email, 'User'),
            'USER',
            now(),
            now()
          )
          ON CONFLICT (id) DO NOTHING;
        EXCEPTION WHEN unique_violation THEN
          NULL;
        END;
        RETURN new;
      END
      $fn$;
    $sql$;

    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';

    EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.handle_new_auth_user()';
  END IF;
END
$$;
