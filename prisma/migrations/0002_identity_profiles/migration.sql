-- Identity model: `BuildingUser` becomes `profiles`, the identity table every
-- Row Level Security policy resolves the caller through.
--
-- The id becomes a uuid because it is carried as the JWT `sub` claim and read by
-- `auth.uid()` / `private.current_user_id()`, both of which cast to uuid.
-- Rows whose id is not a uuid are re-keyed first so the cast cannot fail.

DO $$
DECLARE
  legacy record;
BEGIN
  FOR legacy IN
    SELECT "id"
    FROM "BuildingUser"
    WHERE "id" !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  LOOP
    UPDATE "BuildingUser" SET "id" = gen_random_uuid()::text WHERE "id" = legacy."id";
  END LOOP;
END
$$;

ALTER TYPE "Role" RENAME VALUE 'BUILDING_USER' TO 'USER';

ALTER TABLE "BuildingUser" RENAME TO "profiles";

-- Prisma names constraints after the model, so they still carry the old name
-- after the table was renamed. Rename whatever is there, skip what is missing.
DO $$
DECLARE
  named text;
BEGIN
  FOR named IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname LIKE 'BuildingUser%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.profiles RENAME CONSTRAINT %I TO %I',
      named,
      replace(named, 'BuildingUser', 'profiles')
    );
  END LOOP;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'BuildingUser_email_key') THEN
    EXECUTE 'ALTER INDEX public."BuildingUser_email_key" RENAME TO "profiles_email_key"';
  END IF;
END
$$;

ALTER TABLE "profiles" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;

ALTER TABLE "profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'USER';

ALTER TABLE "profiles" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "profiles" ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "profiles" SET "updatedAt" = "createdAt";

ALTER TABLE "profiles" ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE INDEX "profiles_buildingId_idx" ON "profiles"("buildingId");
