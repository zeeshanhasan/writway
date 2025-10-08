# Environment Variables Setup Guide

## Creating Your .env File

The `.env` file is git-ignored for security. You must create it manually.

### Step 1: Create the file

```bash
cd /Users/zeeshanhasan/Development/writway/backend
touch .env
```

### Step 2: Copy this template into your .env file

```bash
# ============================================
# Environment Configuration
# ============================================
NODE_ENV=development

# ============================================
# Database (Supabase PostgreSQL)
# ============================================
# IMPORTANT: Use the POOLED connection string for runtime (port 6543 with pgBouncer)
# Get this from: Supabase Dashboard > Settings > Database > Connection Pooling
DATABASE_URL=postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@db.[YOUR_REGION].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require

# Direct connection for migrations ONLY (port 5432, no pgBouncer)
# Get this from: Supabase Dashboard > Settings > Database > Connection String
DIRECT_DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_REGION].supabase.co:5432/postgres?sslmode=require

# ============================================
# Prisma Configuration
# ============================================
# CRITICAL: Must be true for Vercel serverless + Supabase
PRISMA_DISABLE_PREPARED_STATEMENTS=true

# ============================================
# JWT Authentication
# ============================================
# Generate strong secrets (at least 32 characters)
# You can use: openssl rand -base64 32
JWT_SECRET=REPLACE_WITH_STRONG_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_STRONG_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# CORS Configuration
# ============================================
# Comma-separated list of allowed origins
CORS_ORIGIN=http://localhost:3000,https://writway.com

# ============================================
# Google OAuth 2.0
# ============================================
# Get credentials from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/callback

# Production callback URL (update when deploying):
# GOOGLE_CALLBACK_URL=https://api.writway.com/api/v1/auth/callback

# ============================================
# Stripe Payment Integration
# ============================================
# Get keys from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Production keys (update when deploying):
# STRIPE_SECRET_KEY=sk_live_your_live_key
# STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# ============================================
# Server Configuration
# ============================================
PORT=3001
```

### Step 3: Fill in your actual values

#### Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Database**
3. Find **Connection Pooling** section:
   - Copy the connection string (port 6543)
   - Paste as `DATABASE_URL`
4. Find **Connection String** section:
   - Copy the direct connection string (port 5432)
   - Paste as `DIRECT_DATABASE_URL`
5. Replace `[YOUR_PASSWORD]` with your actual database password

#### Generate JWT Secrets

Run these commands to generate strong secrets:

```bash
# For JWT_SECRET
openssl rand -base64 32

# For JWT_REFRESH_SECRET
openssl rand -base64 32
```

Copy each output and paste into your `.env` file.

#### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (or use existing)
3. Add authorized redirect URIs:
   - `http://localhost:3001/api/v1/auth/callback` (development)
   - `https://api.writway.com/api/v1/auth/callback` (production)
4. Copy Client ID and Client Secret to `.env`

#### Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your test keys for development
3. Add to `.env` file

### Step 4: Verify your .env file

Run this command to check if all variables are set:

```bash
cat .env | grep -v "^#" | grep -v "^$"
```

You should see all variables with actual values (no REPLACE_WITH or [YOUR_).

## Environment Variables for Production (Vercel)

When deploying to Vercel, set these environment variables in the Vercel dashboard:

### Vercel Dashboard Steps

1. Go to your Vercel project
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable from above with production values:
   - Use **production** Supabase credentials
   - Use **production** Google OAuth callback URL
   - Use **production** Stripe live keys
   - Use **production** CORS origin (https://writway.com)

### Critical Vercel-Specific Settings

```bash
PRISMA_DISABLE_PREPARED_STATEMENTS=true  # MUST be set in Vercel
NODE_ENV=production
GOOGLE_CALLBACK_URL=https://api.writway.com/api/v1/auth/callback
CORS_ORIGIN=https://writway.com
```

## Security Checklist

- [ ] `.env` file is listed in `.gitignore`
- [ ] Never commit `.env` to git
- [ ] Use different secrets for development and production
- [ ] Use different database for development and production
- [ ] Rotate secrets regularly in production
- [ ] Use Stripe test keys in development, live keys in production only

## Troubleshooting

### Error: "JWT_SECRET not configured"

- Make sure JWT_SECRET is set in `.env`
- Restart your development server after changing `.env`

### Error: "Database connection failed"

- Check that DATABASE_URL is correct
- Verify Supabase project is running
- Check that your IP is allowed in Supabase settings
- Verify password is correct (no special characters breaking the URL)

### Error: "Prepared statement errors"

- Ensure `PRISMA_DISABLE_PREPARED_STATEMENTS=true` is set
- This is required for Supabase pgBouncer connection pooling

## Next Steps

After creating `.env`:

1. Install dependencies: `npm install`
2. Generate Prisma client: `npm run db:generate`
3. Run migrations: `npm run db:migrate:dev`
4. Start development server: `npm run dev`
5. Test health endpoint: `curl http://localhost:3001/api/v1/health`

