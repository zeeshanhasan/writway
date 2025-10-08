# UUID Migration Plan

## Overview
This document outlines the migration from `cuid()` generated IDs to database-generated UUIDs for all models in the WritWay backend.

## Why Migrate?
1. **Performance**: DB-generated UUIDs are more efficient in PostgreSQL
2. **Standards Compliance**: Aligns with backend.mdc rules
3. **Better Indexing**: PostgreSQL UUID type has better index performance
4. **Portability**: Standard UUID format across all systems

## Models to Migrate
1. `User` (id, tenantId)
2. `Tenant` (id, planId)
3. `Plan` (id)
4. `RefreshToken` (id, userId) - will be created with UUID from start

## Migration Strategy

### Phase 1: Add RefreshToken Model (Current State)
- RefreshToken model uses `cuid()` temporarily
- Will be migrated to UUID in Phase 2

### Phase 2: Create UUID Migration (Future)
**WARNING**: This is a breaking change and requires careful execution.

#### Pre-Migration Steps
1. **Backup Database**: Full backup before migration
2. **Test in Development**: Run migration on dev database first
3. **Schedule Maintenance Window**: Coordinate with team

#### Migration Steps (Simplified)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Plans table (no dependencies)
ALTER TABLE plans ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
UPDATE plans SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE plans DROP CONSTRAINT plans_pkey;
ALTER TABLE plans DROP COLUMN id;
ALTER TABLE plans RENAME COLUMN id_new TO id;
ALTER TABLE plans ADD PRIMARY KEY (id);

-- Step 2: Tenants table
ALTER TABLE tenants ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
ALTER TABLE tenants ADD COLUMN plan_id_new UUID;
UPDATE tenants t SET plan_id_new = p.id FROM plans p WHERE t.plan_id = p.id;
ALTER TABLE tenants DROP CONSTRAINT tenants_pkey;
ALTER TABLE tenants DROP CONSTRAINT tenants_plan_id_fkey;
ALTER TABLE tenants DROP COLUMN id, DROP COLUMN plan_id;
ALTER TABLE tenants RENAME COLUMN id_new TO id;
ALTER TABLE tenants RENAME COLUMN plan_id_new TO plan_id;
ALTER TABLE tenants ADD PRIMARY KEY (id);
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);

-- Step 3: Users table
ALTER TABLE users ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN tenant_id_new UUID;
UPDATE users u SET tenant_id_new = t.id FROM tenants t WHERE u.tenant_id = t.id;
ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users DROP CONSTRAINT users_tenant_id_fkey;
ALTER TABLE users DROP COLUMN id, DROP COLUMN tenant_id;
ALTER TABLE users RENAME COLUMN id_new TO id;
ALTER TABLE users RENAME COLUMN tenant_id_new TO tenant_id;
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Step 4: RefreshTokens table
ALTER TABLE refresh_tokens ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
ALTER TABLE refresh_tokens ADD COLUMN user_id_new UUID;
UPDATE refresh_tokens rt SET user_id_new = u.id FROM users u WHERE rt.user_id = u.id;
ALTER TABLE refresh_tokens DROP CONSTRAINT refresh_tokens_pkey;
ALTER TABLE refresh_tokens DROP CONSTRAINT refresh_tokens_user_id_fkey;
ALTER TABLE refresh_tokens DROP COLUMN id, DROP COLUMN user_id;
ALTER TABLE refresh_tokens RENAME COLUMN id_new TO id;
ALTER TABLE refresh_tokens RENAME COLUMN user_id_new TO user_id;
ALTER TABLE refresh_tokens ADD PRIMARY KEY (id);
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

#### Post-Migration Steps
1. **Verify Data Integrity**: Check all relationships
2. **Regenerate Prisma Client**: `npm run db:generate`
3. **Test Application**: Run full test suite
4. **Monitor**: Watch for any UUID-related issues

## Updated Prisma Schema (Target State)

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
  id                     String   @id @db.Uuid @default(dbgenerated("gen_random_uuid()"))
  name                   String?
  address                String?
  country                String?
  city                   String?
  businessType           String?  @map("business_type")
  practiceAreas          String?  @map("practice_areas")
  activeClients          Int?     @map("active_clients")
  goals                  String?
  planId                 String   @db.Uuid @map("plan_id")
  isOnboardingComplete   Boolean  @default(false) @map("is_onboarding_complete")
  trialEndsAt            DateTime? @map("trial_ends_at")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")
  users                  User[]
  plan                   Plan     @relation(fields: [planId], references: [id])

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

## Rollback Plan
**DO NOT ROLLBACK** the database migration once applied. This could lead to data loss.

Instead, if issues arise:
1. Fix the application code to work with UUIDs
2. Apply a forward-fixing migration if needed
3. Keep the database in UUID format

## Testing Checklist
- [ ] Backup database
- [ ] Run migration on development database
- [ ] Verify all foreign key relationships intact
- [ ] Test user authentication flow
- [ ] Test tenant operations
- [ ] Test plan queries
- [ ] Verify no broken references
- [ ] Check application logs for UUID parsing errors
- [ ] Test refresh token creation/validation

## Timeline
- **Immediate**: Add RefreshToken model with cuid()
- **Future (TBD)**: Schedule UUID migration during maintenance window

## Notes
- This migration should be run during a scheduled maintenance window
- All users will need to re-authenticate after migration (tokens will be invalidated)
- Frontend should handle this gracefully by redirecting to login

