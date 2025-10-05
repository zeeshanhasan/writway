# Feature: Unified Authentication, Tenant Onboarding, and Subscription Setup

## Overview
Implement a unified authentication and onboarding flow for WritWay — a multi-tenant SaaS for paralegals — using Google OAuth as the single entry point for both registration and login.  
This feature also includes initial tenant creation, onboarding data collection, plan assignment, and routing to the dashboard only after onboarding completion.

---

## Goals
1. Unify Login and Register into one Google-based flow.
2. Automatically create a new Tenant and assign a default Free Plan.
3. Collect organization information on first sign-in via a Welcome (Onboarding) page.
4. Prevent dashboard access until onboarding is completed.
5. Initialize package and billing setup for Free, Plus, Pro, and Enterprise plans.
6. Support future upgrade/downgrade via Stripe.

---

## User Flow Summary

| Step | Description | Route | Outcome |
|------|--------------|--------|----------|
| 1 | User clicks **Login** or **Register** (both use Google OAuth) | `/auth/login` or `/auth/register` | Redirects to Google consent |
| 2 | OAuth callback | `/api/auth/callback` | Token verified |
| 3 | Post-login logic | `/api/auth/post-login` | Check if user exists |
| 4 | If new user | — | Create User + Tenant + assign Free Plan, set `isOnboardingComplete = false` |
| 5 | If existing but onboarding incomplete | — | Redirect `/welcome` |
| 6 | If existing and onboarding complete | — | Redirect `/dashboard` |
| 7 | Onboarding form submit | `/api/tenant/:id/complete` | Mark tenant active, redirect dashboard |

---

## Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  googleId      String?   @unique
  email         String    @unique
  name          String
  image         String?
  role          UserRole  @default(OWNER)
  tenantId      String
  Tenant        Tenant    @relation(fields: [tenantId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Tenant {
  id                String   @id @default(cuid())
  name              String?
  address           String?
  country           String?
  city              String?
  businessType      String?
  practiceAreas     String?
  activeClients     Int?
  goals             String?
  planId            String
  isOnboardingComplete Boolean @default(false)
  trialEndsAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  users             User[]
  Plan              Plan      @relation(fields: [planId], references: [id])
}

model Plan {
  id            String   @id @default(cuid())
  name          String   @unique
  priceMonthly  Float
  seatLimit     Int
  clientLimit   Int
  hasTrial      Boolean
  trialDays     Int?
  features      Json
  tenants       Tenant[]
}

enum UserRole {
  SUPER_ADMIN
  OWNER
  ADMIN
  USER
}
```

---

## Default Plan Seeding

| Plan | Monthly Fee | Seats | Client Limit | Trial | Features |
|------|--------------|--------|---------------|--------|-----------|
| Free | $0 | 1 | 5 | No | Basic CRM only |
| Plus | $29 | 3 | 50 | 30 days | Tasks + Workflows |
| Pro | $79 | 10 | 200 | 30 days | Automation + Pipeline |
| Enterprise | Custom | Unlimited | Unlimited | 30 days | All features + Priority Support |

---

## API Endpoints

### `/api/auth/google`
Handles Google OAuth initiation (NextAuth.js or Passport.js).

### `/api/auth/callback`
OAuth callback — exchanges Google code for access token, retrieves user info.

### `/api/auth/post-login`
**Method:** `POST`  
**Purpose:** Central logic for routing users after login.

**Steps:**
1. Check if user exists by Google ID or email.
2. If not:
   - Create Tenant
   - Assign Free Plan
   - Create User (role: OWNER)
   - Return redirect: `/welcome`
3. If exists:
   - If `Tenant.isOnboardingComplete = false` → `/welcome`
   - Else → `/dashboard`

### `/api/tenant/:id/complete`
**Method:** `PATCH`  
Marks onboarding complete after org info is submitted.

**Request Body:**
```json
{
  "name": "Smith Legal Group",
  "address": "123 Main St",
  "country": "Canada",
  "city": "Toronto",
  "businessType": "Legal Services",
  "practiceAreas": "Family Law, Immigration",
  "activeClients": 45,
  "goals": "Automate monthly document workflows"
}
```

### `/api/plan/list`
Returns available plans and features for pricing and upgrades.

### `/api/plan/upgrade`
Triggers Stripe checkout session for upgrade.

### `/api/billing/webhook`
Stripe webhook for payment status updates.

---

## Frontend Routes

| Route | Description |
|--------|--------------|
| `/auth/login` | Google sign-in for existing users |
| `/auth/register` | Google sign-in for new users |
| `/welcome` | Onboarding page for org info (blocked until completion) |
| `/dashboard` | Main dashboard after activation |
| `/pricing` | Public pricing page with plan comparison |
| `/terms` | Terms and conditions (public) |

---

## Frontend Components

### `AuthButton`
- One component used for both “Sign In” and “Register”
- Accepts `intent` prop → modifies label text only
- Always calls the same Google login function

### `WelcomeForm`
- Form fields: name, address, country, city, business type, practice areas, active clients, goals
- Submit → PATCH `/api/tenant/:id/complete`
- On success → Redirect `/dashboard`

### `ProtectedRoute` Middleware
- Checks session and tenant status.
- If not authenticated → `/auth/login`
- If authenticated but onboarding incomplete → `/welcome`
- If onboarding complete → allow access

---

## Redirect Logic Summary

| Condition | Redirect |
|------------|-----------|
| User not authenticated | `/auth/login` |
| New user (no tenant) | `/welcome` |
| Tenant onboarding incomplete | `/welcome` |
| Onboarding complete | `/dashboard` |

---

## UX & UI Guidelines (from `ui.mdc`)
- Use minimal onboarding form design — one card layout, centered, with progress indicator.
- Typography: large bold heading “Welcome to WritWay”
- Subtext: “Let’s set up your firm details before you begin.”
- Button styles: Primary → “Continue to Dashboard”
- Maintain consistency with `ui.mdc` button and form component definitions.

---

## Edge Cases
- If user signs in through `/auth/login` but not registered → redirect to `/auth/register` (with notice: “We couldn’t find your account, please register first.”)
- If onboarding form partially filled and user logs out → progress saved server-side; resume on next login.
- If Free plan user exceeds limits → show non-blocking upgrade modal with Stripe link.

---

## Acceptance Criteria
- ✅ One unified Google OAuth entry point for Login and Register.
- ✅ New users create Tenant and assigned Free plan automatically.
- ✅ Onboarding required before dashboard access.
- ✅ Returning users land directly in dashboard.
- ✅ Nonexistent users attempting login are gracefully rerouted to register.
- ✅ Plan seeding and upgrade endpoints prepared for Stripe integration.
- ✅ UI matches brand tone and `ui.mdc` styling rules.

---

## Future Enhancements
- Invite team members (seat-based limits)
- Tenant settings page for plan management
- Stripe webhook integration for auto plan updates
- Add regional billing currencies
- Add “complete onboarding” progress tracker widget in dashboard
