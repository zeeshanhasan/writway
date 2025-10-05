-- Non-destructive alter for existing public.users to match Prisma mappings
-- 1) Ensure enum has required values and defaults
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN','OWNER','ADMIN','USER');
    END IF;
END $$;

-- 1b) Ensure required enum values exist (each in its own tx)
BEGIN; DO $$ BEGIN
    BEGIN
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OWNER';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$; COMMIT;

-- 2) Add missing columns if they do not exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3) Role default OWNER (after enum committed)
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OWNER';

-- 4) Unique index on google_id (ignore if exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'users_google_id_key'
    ) THEN
        CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
    END IF;
END $$;

-- 5) Add FK users.tenant_id -> tenants.id if not exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='tenant_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            WHERE tc.table_schema='public' AND tc.table_name='users' AND tc.constraint_name='users_tenant_id_fkey'
        ) THEN
            ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;


