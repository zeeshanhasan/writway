# Database Migration Execution Guide

## ⚠️ CRITICAL WARNING

**This guide contains irreversible database operations.**

- Back up your database before proceeding
- Test on development database first
- Never run UUID migration on production without testing
- Have a rollback plan ready

## Phase 1: Add RefreshToken Table (Safe - Do This Now)

This migration is **safe** and **non-destructive**. It only adds a new table.

### Step 1: Verify Prisma Schema

The `RefreshToken` model should already be in `/backend/prisma/schema.prisma`:

```prisma
model RefreshToken {
  id        String    @id @default(cuid())
  tokenHash String    @unique @map("token_hash")
  userId    String    @map("user_id")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  @@map("refresh_tokens")
}
```

### Step 2: Generate Prisma Client

```bash
cd /Users/zeeshanhasan/Development/writway/backend
npm run db:generate
```

Expected output:
```
✔ Generated Prisma Client
```

### Step 3: Create Migration

```bash
npm run db:migrate:dev
```

When prompted for migration name, enter: `add_refresh_tokens`

This will:
1. Create SQL migration file
2. Apply migration to your development database
3. Update Prisma Client

### Step 4: Verify Migration

Check that the table was created:

```bash
npx prisma studio
```

Or connect to Supabase and verify `refresh_tokens` table exists.

### Step 5: Test Locally

```bash
npm run dev
```

Test authentication endpoints:
- `http://localhost:3001/api/v1/health` - should return OK
- `http://localhost:3001/api/v1/ready` - should show DB connected

## Phase 2: UUID Migration (⚠️ DANGEROUS - Do NOT Run Without Testing)

**DO NOT RUN THIS IN PRODUCTION YET!**

This migration will:
- Change all primary keys from `cuid()` strings to UUID format
- Update all foreign key relationships
- **Invalidate all existing user sessions**
- **Change all API responses** (different ID format)

### Prerequisites Before UUID Migration

- [ ] Backup production database (full backup + export)
- [ ] Test migration on development database first
- [ ] Verify all application code works with UUIDs
- [ ] Schedule maintenance window (users will be logged out)
- [ ] Notify users of planned downtime
- [ ] Have rollback plan ready
- [ ] Test rollback procedure

### UUID Migration Steps (Development Only)

#### Step 1: Update Prisma Schema to Use UUIDs

Replace the current schema with UUID-based IDs:

```prisma
model User {
  id             String         @id @db.Uuid @default(dbgenerated("gen_random_uuid()"))
  googleId       String?        @unique @map("google_id")
  email          String         @unique
  name           String
  image          String?
  role           UserRole       @default(OWNER)
  tenantId       String         @db.Uuid @map("tenant_id")
  tenant         Tenant         @relation(fields: [tenantId], references: [id])
  refreshTokens  RefreshToken[]
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")

  @@map("users")
}

model Tenant {
  id                     String    @id @db.Uuid @default(dbgenerated("gen_random_uuid()"))
  name                   String?
  address                String?
  country                String?
  city                   String?
  businessType           String?   @map("business_type")
  practiceAreas          String?   @map("practice_areas")
  activeClients          Int?      @map("active_clients")
  goals                  String?
  planId                 String    @db.Uuid @map("plan_id")
  isOnboardingComplete   Boolean   @default(false) @map("is_onboarding_complete")
  trialEndsAt            DateTime? @map("trial_ends_at")
  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @updatedAt @map("updated_at")
  users                  User[]
  plan                   Plan      @relation(fields: [planId], references: [id])

  @@map("tenants")
}

model Plan {
  id            String   @id @db.Uuid @default(dbgenerated("gen_random_uuid()"))
  name          String   @unique
  priceMonthly  Float    @map("price_monthly")
  seatLimit     Int      @map("seat_limit")
  clientLimit   Int      @map("client_limit")
  hasTrial      Boolean  @map("has_trial")
  trialDays     Int?     @map("trial_days")
  features      Json
  tenants       Tenant[]

  @@map("plans")
}

model RefreshToken {
  id        String    @id @db.Uuid @default(dbgenerated("gen_random_uuid()"))
  tokenHash String    @unique @map("token_hash")
  userId    String    @db.Uuid @map("user_id")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  @@map("refresh_tokens")
}
```

#### Step 2: Create Custom Migration

**DO NOT use `prisma migrate dev` for this!**

You must create a custom migration that preserves data relationships.

Create file: `/backend/prisma/migrations/20250108_migrate_to_uuids/migration.sql`

```sql
-- =============================================
-- UUID Migration Script
-- =============================================
-- WARNING: This is a breaking change!
-- All IDs will change format
-- All user sessions will be invalidated
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Plans table (no dependencies from other tables)
-- Add new UUID column
ALTER TABLE plans ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- Generate UUIDs for all existing rows
UPDATE plans SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- Make id_new NOT NULL
ALTER TABLE plans ALTER COLUMN id_new SET NOT NULL;

-- Step 2: Tenants table
-- Add new UUID columns
ALTER TABLE tenants ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
ALTER TABLE tenants ADD COLUMN plan_id_new UUID;

-- Generate UUIDs
UPDATE tenants SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- Map old plan_id to new plan_id_new using the plans table
UPDATE tenants t 
SET plan_id_new = p.id_new 
FROM plans p 
WHERE t.plan_id = p.id;

-- Make columns NOT NULL
ALTER TABLE tenants ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN plan_id_new SET NOT NULL;

-- Step 3: Users table
-- Add new UUID columns
ALTER TABLE users ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN tenant_id_new UUID;

-- Generate UUIDs
UPDATE users SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- Map old tenant_id to new tenant_id_new using the tenants table
UPDATE users u 
SET tenant_id_new = t.id_new 
FROM tenants t 
WHERE u.tenant_id = t.id;

-- Make columns NOT NULL
ALTER TABLE users ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id_new SET NOT NULL;

-- Step 4: RefreshTokens table (if exists)
-- Add new UUID columns
ALTER TABLE refresh_tokens ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
ALTER TABLE refresh_tokens ADD COLUMN user_id_new UUID;

-- Generate UUIDs
UPDATE refresh_tokens SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- Map old user_id to new user_id_new using the users table
UPDATE refresh_tokens rt 
SET user_id_new = u.id_new 
FROM users u 
WHERE rt.user_id = u.id;

-- Make columns NOT NULL
ALTER TABLE refresh_tokens ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE refresh_tokens ALTER COLUMN user_id_new SET NOT NULL;

-- Step 5: Drop old columns and rename new ones
-- Start with refresh_tokens (most dependent)
ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
ALTER TABLE refresh_tokens DROP COLUMN id;
ALTER TABLE refresh_tokens DROP COLUMN user_id;
ALTER TABLE refresh_tokens RENAME COLUMN id_new TO id;
ALTER TABLE refresh_tokens RENAME COLUMN user_id_new TO user_id;
ALTER TABLE refresh_tokens ADD PRIMARY KEY (id);

-- Then users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users DROP COLUMN tenant_id;
ALTER TABLE users RENAME COLUMN id_new TO id;
ALTER TABLE users RENAME COLUMN tenant_id_new TO tenant_id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Then tenants
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_plan_id_fkey;
ALTER TABLE tenants DROP COLUMN id;
ALTER TABLE tenants DROP COLUMN plan_id;
ALTER TABLE tenants RENAME COLUMN id_new TO id;
ALTER TABLE tenants RENAME COLUMN plan_id_new TO plan_id;
ALTER TABLE tenants ADD PRIMARY KEY (id);

-- Finally plans (least dependent)
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_pkey;
ALTER TABLE plans DROP COLUMN id;
ALTER TABLE plans RENAME COLUMN id_new TO id;
ALTER TABLE plans ADD PRIMARY KEY (id);

-- Step 6: Re-add foreign key constraints
ALTER TABLE tenants 
  ADD CONSTRAINT tenants_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES plans(id);

ALTER TABLE users 
  ADD CONSTRAINT users_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE refresh_tokens 
  ADD CONSTRAINT refresh_tokens_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 7: Recreate unique constraints
ALTER TABLE users ADD CONSTRAINT users_google_id_key UNIQUE (google_id);
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE plans ADD CONSTRAINT plans_name_key UNIQUE (name);
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);

-- Migration complete
-- Verify data integrity after migration
```

#### Step 3: Apply Migration (Development Only!)

```bash
# Generate Prisma client with new schema
npm run db:generate

# Apply the custom migration
npx prisma db execute --file ./prisma/migrations/20250108_migrate_to_uuids/migration.sql --schema ./prisma/schema.prisma

# Update migration history
npx prisma migrate resolve --applied 20250108_migrate_to_uuids
```

#### Step 4: Verify Migration

```bash
# Check Prisma introspection
npx prisma db pull

# Verify in Prisma Studio
npx prisma studio
```

Check that:
- All `id` columns are now UUID type
- All foreign key relationships are intact
- Unique constraints are preserved
- Data is not lost

#### Step 5: Test Application

```bash
npm run dev
```

Test all functionality:
- User authentication
- Tenant queries
- Plan queries
- Refresh token creation

### Rollback Plan (If UUID Migration Fails)

**DO NOT rollback the database!** This can cause data loss.

Instead:
1. Fix the migration script
2. Re-run the migration
3. Keep moving forward

If absolutely necessary to rollback:
1. Restore from backup (taken before migration)
2. Lose any data created after backup
3. Revert code to pre-migration version

## Production Deployment Checklist

When ready to deploy UUID migration to production:

- [ ] Successfully tested on development database
- [ ] Full production database backup completed
- [ ] Backup verified and downloadable
- [ ] Maintenance window scheduled
- [ ] Users notified of downtime
- [ ] Migration script reviewed by team
- [ ] Rollback procedure documented
- [ ] Monitoring in place
- [ ] Support team on standby

## Current Recommendation

**For immediate deployment**: 
✅ Run Phase 1 only (RefreshToken table with cuid)
❌ Skip Phase 2 (UUID migration) for now

**Reasons**:
1. RefreshToken migration is safe and non-destructive
2. UUID migration is complex and risky
3. System works perfectly fine with cuid() IDs
4. UUID migration can be done later during scheduled maintenance

## Summary

| Migration | Status | Risk | Action |
|-----------|--------|------|--------|
| RefreshToken table | ✅ Ready | Low | Execute now |
| UUID conversion | ⏸️ Planned | High | Defer to maintenance window |

Execute Phase 1 now, plan Phase 2 for later.

