-- Create tables for plans and tenants only (leave existing public.users untouched)

-- CreateTable plans first (referenced by tenants)
CREATE TABLE IF NOT EXISTS "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_monthly" DOUBLE PRECISION NOT NULL,
    "seat_limit" INTEGER NOT NULL,
    "client_limit" INTEGER NOT NULL,
    "has_trial" BOOLEAN NOT NULL,
    "trial_days" INTEGER,
    "features" JSONB NOT NULL,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- Ensure unique plan names
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'plans_name_key'
    ) THEN
        CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");
    END IF;
END $$;

-- CreateTable tenants
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "country" TEXT,
    "city" TEXT,
    "business_type" TEXT,
    "practice_areas" TEXT,
    "active_clients" INTEGER,
    "goals" TEXT,
    "plan_id" TEXT NOT NULL,
    "is_onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- Add FK tenants.plan_id -> plans.id if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public' AND tc.table_name = 'tenants' AND tc.constraint_name = 'tenants_plan_id_fkey'
    ) THEN
        ALTER TABLE "tenants"
        ADD CONSTRAINT "tenants_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

