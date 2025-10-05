# WritWay Backend API

This is the backend API for WritWay, a multi-tenant SaaS platform for paralegals and legal professionals.

## Features

- **Unified Authentication**: Google OAuth for both login and registration
- **Multi-tenant Architecture**: Row-level security with tenant isolation
- **Onboarding Flow**: Collect business information before dashboard access
- **Plan Management**: Free, Plus, Pro, and Enterprise tiers
- **Stripe Integration**: Ready for subscription billing (placeholder implementation)

## Tech Stack

- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js with Google OAuth
- **Validation**: Zod schemas
- **Sessions**: Express-session with Redis (optional)
- **Testing**: Jest + Supertest

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

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/post-login` - Post-login logic and routing
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Tenant Management
- `GET /api/tenant/:id` - Get tenant details
- `PATCH /api/tenant/:id/complete` - Complete onboarding
- `PATCH /api/tenant/:id/settings` - Update tenant settings

### Plans
- `GET /api/plan/list` - Get all available plans
- `GET /api/plan/:id` - Get plan details

### Billing
- `POST /api/billing/upgrade` - Create Stripe checkout session
- `POST /api/billing/webhook` - Stripe webhook handler
- `GET /api/billing/info` - Get billing information

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

## User Flow

1. **Registration/Login**: User clicks Google OAuth button
2. **OAuth Callback**: Backend handles Google authentication
3. **User Creation**: New users get tenant + Free plan automatically
4. **Onboarding**: Incomplete onboarding redirects to `/auth/welcome`
5. **Dashboard Access**: Only after onboarding completion

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with default data
- `npm run db:reset` - Reset database and reseed
- `npm test` - Run tests

### Project Structure

```
backend/
├── src/
│   ├── api/           # Route handlers
│   ├── config/        # Database and Passport config
│   ├── middlewares/   # Auth and error handling
│   └── index.js       # Main server file
├── prisma/
│   ├── schema.prisma  # Database schema
│   └── seed.js        # Database seeding
└── tests/             # Test files
```

## Security

- **Multi-tenant Isolation**: Prisma middleware ensures tenant data separation
- **JWT Authentication**: Stateless token-based auth
- **Input Validation**: Zod schemas for all API inputs
- **CORS Protection**: Configurable origin allowlist
- **Helmet Security**: Security headers and protections

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
