# WritWay Backend API

This is the backend API for WritWay, a multi-tenant SaaS platform for paralegals and legal professionals.

## Features

- **Unified Authentication**: Google OAuth for both login and registration
- **Multi-tenant Architecture**: Row-level security with tenant isolation
- **Onboarding Flow**: Collect business information before dashboard access
- **Plan Management**: Free, Plus, Pro, and Enterprise tiers
- **Stripe Integration**: Ready for subscription billing (placeholder implementation)

## Tech Stack

- **Runtime**: Node.js with Express (TypeScript)
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**: JWT with Google OAuth2
- **Validation**: Zod schemas
- **Testing**: Jest + Supertest
- **Deployment**: Vercel Serverless Functions

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials
- Redis (optional, for sessions)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
   - `JWT_SECRET`: Strong secret for JWT tokens
   - `SESSION_SECRET`: Session secret
   - `CORS_ORIGIN`: Frontend URL (e.g., http://localhost:3000)

3. **Database setup**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed default data
   npm run db:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

All endpoints are mounted under `/api/v1`

### Health & Monitoring
- `GET /api/v1/health` - Health check (liveness)
- `GET /api/v1/ready` - Readiness check (database connectivity)

### Authentication
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/callback` - OAuth callback handler
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/refresh` - Refresh access token

### Tenant Management
- `GET /api/v1/tenant/:id` - Get tenant details
- `PATCH /api/v1/tenant/:id/complete` - Complete onboarding
- `PATCH /api/v1/tenant/:id/settings` - Update tenant settings

### Plans
- `GET /api/v1/plan/list` - Get all available plans
- `GET /api/v1/plan/:id` - Get plan details

### Billing
- `POST /api/v1/billing/upgrade` - Create Stripe checkout session
- `POST /api/v1/billing/webhook` - Stripe webhook handler
- `GET /api/v1/billing/info` - Get billing information

## Database Schema

### Core Models

- **User**: User accounts with Google OAuth integration
- **Tenant**: Organization/workspace with multi-tenant isolation
- **Plan**: Subscription plans with features and limits

### Key Features

- **Multi-tenancy**: All tenant-scoped data includes `tenant_id`
- **Role-based Access**: SUPER_ADMIN, OWNER, ADMIN, USER roles
- **Onboarding Flow**: `isOnboardingComplete` flag controls dashboard access
- **Plan Limits**: Seat limits, client limits, and feature flags
- **JWT Tokens**: Stateless authentication with refresh token rotation
- **RefreshTokens**: Hashed tokens stored in DB with expiry and revocation

## User Flow

1. **Registration/Login**: User clicks Google OAuth button
2. **OAuth Callback**: Backend handles Google authentication
3. **User Creation**: New users get tenant + Free plan automatically
4. **Onboarding**: Incomplete onboarding redirects to `/auth/welcome`
5. **Dashboard Access**: Only after onboarding completion

## Development

### Scripts

- `npm run dev` - Start development server with TypeScript watch mode
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server (compiled JS)
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate:dev` - Run database migrations (development)
- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run db:seed` - Seed database with default data
- `npm run db:reset` - Reset database and reseed
- `npm test` - Run tests with Jest
- `npm run typecheck` - Type check without emitting files

### Project Structure

```
backend/
├── api/                  # Vercel serverless entry points
│   ├── [...path].ts      # Catch-all handler (wraps Express app)
│   └── v1/
│       ├── health.ts     # Dedicated health endpoint
│       └── ready.ts      # Dedicated ready endpoint
├── src/
│   ├── routes/           # API route handlers (TypeScript)
│   │   ├── auth.ts
│   │   ├── tenant.ts
│   │   ├── plan.ts
│   │   └── billing.ts
│   ├── services/         # Business logic layer
│   │   └── auth.service.ts
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.ts       # JWT verification
│   │   ├── errorHandler.ts
│   │   ├── requestId.ts
│   │   └── rbac.ts
│   ├── utils/            # Helper functions
│   │   └── dbHealth.ts
│   ├── app.ts            # Express app configuration
│   └── index.ts          # Local server entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Database seeding
│   └── migrations/       # Migration files
├── tests/                # Test files
│   └── health.test.ts
├── vercel.json           # Vercel configuration
├── tsconfig.json         # TypeScript configuration
└── jest.config.ts        # Jest test configuration
```

## Security

- **Multi-tenant Isolation**: Prisma middleware ensures tenant data separation
- **JWT Authentication**: Stateless token-based auth with refresh token rotation
- **Input Validation**: Zod schemas for all API inputs
- **CORS Protection**: Configurable origin allowlist
- **Helmet Security**: Security headers and protections
- **httpOnly Cookies**: Tokens stored in secure httpOnly cookies
- **Token Revocation**: Refresh tokens can be revoked on logout

## Response Format

All API responses follow a standard envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

**Error:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

## Future Enhancements

- Stripe webhook integration for real billing
- Team member invitations
- Advanced analytics and reporting
- API rate limiting
- Audit logging
- Email notifications

## Contributing

1. Follow the established patterns for API routes
2. Add proper validation with Zod schemas
3. Include error handling and logging
4. Write tests for new functionality
5. Update documentation as needed
