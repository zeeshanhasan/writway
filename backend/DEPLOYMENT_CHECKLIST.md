# Backend Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Configuration

- [ ] Create `/backend/.env` file (see `ENV_SETUP_GUIDE.md`)
- [ ] Fill in all required environment variables
- [ ] Generate JWT secrets using `openssl rand -base64 32`
- [ ] Add Supabase connection strings (pooled and direct)
- [ ] Add Google OAuth credentials
- [ ] Add Stripe keys
- [ ] Verify no placeholder values remain

### 2. Install Dependencies

```bash
cd /Users/zeeshanhasan/Development/writway/backend
npm install
```

Expected packages:
- TypeScript and ts-jest
- Express and types
- Prisma Client
- JWT and authentication packages
- All other dependencies from package.json

### 3. Database Setup

- [ ] Verify Supabase project is accessible
- [ ] Run `npm run db:generate` to generate Prisma Client
- [ ] Run `npm run db:migrate:dev` to create RefreshToken table
- [ ] Verify migration succeeded in Supabase dashboard
- [ ] Check that `refresh_tokens` table exists

### 4. Code Verification

- [ ] Run `npm run typecheck` - should have zero errors
- [ ] Run `npm test` - all tests should pass
- [ ] Verify no lint errors (if linter configured)

### 5. Local Testing

- [ ] Start server: `npm run dev`
- [ ] Test health: `curl http://localhost:3001/api/v1/health`
- [ ] Test ready: `curl http://localhost:3001/api/v1/ready`
- [ ] Verify database connection in ready endpoint response

## Vercel Deployment

### 1. Create Vercel Project

- [ ] Log in to [Vercel Dashboard](https://vercel.com)
- [ ] Create new project or select existing
- [ ] Import from Git repository
- [ ] Set project name: `writway-backend` (or similar)
- [ ] Set custom domain: `api.writway.com`

### 2. Configure Build Settings

**Root Directory**: `backend`

**Build Command**: `npm run build`

**Output Directory**: Keep default (Vercel auto-detects)

**Install Command**: `npm install`

**Framework Preset**: Other

### 3. Set Environment Variables

Add these in Vercel Dashboard > Settings > Environment Variables:

**Required for All Environments:**

```bash
NODE_ENV=production
PRISMA_DISABLE_PREPARED_STATEMENTS=true
```

**Database (Supabase):**

```bash
DATABASE_URL=postgresql://postgres.[ref]:[password]@db.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
DIRECT_DATABASE_URL=postgresql://postgres:[password]@db.supabase.co:5432/postgres?sslmode=require
```

**JWT Authentication:**

```bash
JWT_SECRET=[production-secret-32-chars]
JWT_REFRESH_SECRET=[production-refresh-secret-32-chars]
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**CORS:**

```bash
CORS_ORIGIN=https://writway.com
```

**Google OAuth:**

```bash
GOOGLE_CLIENT_ID=[your-production-client-id]
GOOGLE_CLIENT_SECRET=[your-production-client-secret]
GOOGLE_CALLBACK_URL=https://api.writway.com/api/v1/auth/callback
```

**Stripe:**

```bash
STRIPE_SECRET_KEY=[production-live-key]
STRIPE_WEBHOOK_SECRET=[production-webhook-secret]
```

### 4. Domain Configuration

- [ ] Add custom domain: `api.writway.com`
- [ ] Verify DNS records are correct
- [ ] Wait for SSL certificate provisioning
- [ ] Test HTTPS access

### 5. Deploy

- [ ] Commit and push all changes to main branch
- [ ] Vercel auto-deploys on push
- [ ] Monitor build logs in Vercel dashboard
- [ ] Wait for deployment to complete

## Post-Deployment Verification

### 1. Health Checks

Test these endpoints:

```bash
# Health (liveness)
curl https://api.writway.com/api/v1/health

# Expected response:
# {"success":true,"data":{"status":"ok","uptime":...},"error":null}

# Ready (database connectivity)
curl https://api.writway.com/api/v1/ready

# Expected response:
# {"success":true,"data":{"db":"connected"},"error":null}
```

### 2. Authentication Flow

- [ ] Navigate to frontend auth page
- [ ] Click "Login with Google"
- [ ] Complete OAuth flow
- [ ] Verify redirect to callback URL works
- [ ] Check JWT tokens are set in cookies
- [ ] Verify access to protected routes

### 3. API Functionality

Test each endpoint:

- [ ] `GET /api/v1/plan/list` - Lists plans
- [ ] `GET /api/v1/auth/me` - Returns current user (with token)
- [ ] `GET /api/v1/tenant/:id` - Returns tenant details (with auth)
- [ ] `POST /api/v1/auth/logout` - Logs out successfully

### 4. Monitor for Errors

- [ ] Check Vercel logs for errors
- [ ] Check Supabase logs for connection issues
- [ ] Monitor response times
- [ ] Verify no CORS errors in browser console

## Frontend Integration

### 1. Update Frontend Environment Variables

**File**: `/frontend/.env.production` or Vercel dashboard

```bash
NEXT_PUBLIC_API_URL=https://api.writway.com/api/v1
```

### 2. Deploy Frontend

- [ ] Commit environment variable changes
- [ ] Deploy frontend to Vercel
- [ ] Wait for deployment to complete

### 3. End-to-End Testing

- [ ] Visit production frontend
- [ ] Test complete authentication flow
- [ ] Verify onboarding flow
- [ ] Test dashboard access
- [ ] Verify all API calls work
- [ ] Check browser console for errors

## Rollback Plan

If deployment fails:

### Backend Rollback

1. In Vercel dashboard, go to Deployments
2. Find previous working deployment
3. Click "..." menu > "Promote to Production"
4. Wait for rollback to complete

### Frontend Rollback

1. Revert `NEXT_PUBLIC_API_URL` to old value
2. Redeploy frontend

### Database Rollback

**DO NOT rollback database migrations!**

- RefreshToken table is harmless
- Removing it could break active sessions
- Fix forward instead of rolling back

## Post-Deployment Tasks

### 1. Monitor Performance

- [ ] Set up Vercel Analytics (if not already)
- [ ] Monitor error rates in Vercel logs
- [ ] Check database connection pool usage in Supabase
- [ ] Monitor JWT token refresh patterns

### 2. Update Documentation

- [ ] Document production environment variables
- [ ] Update team with new API URL
- [ ] Update API documentation if public

### 3. Security Review

- [ ] Verify all secrets are environment variables (not hardcoded)
- [ ] Check CORS is properly configured
- [ ] Verify HTTPS is enforced
- [ ] Review JWT token expiry times
- [ ] Ensure httpOnly cookies are set correctly

## Success Criteria

✅ All checklist items completed
✅ Health endpoints return 200 OK
✅ Database connectivity confirmed
✅ Authentication flow works end-to-end
✅ No errors in Vercel logs
✅ No errors in browser console
✅ All API responses use standard envelope
✅ Frontend successfully communicates with backend

## Troubleshooting

### "Database connection failed"

- Check `DATABASE_URL` is pooled connection (port 6543)
- Verify `PRISMA_DISABLE_PREPARED_STATEMENTS=true` is set
- Check Supabase project is active

### "CORS errors in browser"

- Verify `CORS_ORIGIN` includes frontend URL
- Check frontend is using correct API URL
- Ensure credentials: true in CORS config

### "JWT token errors"

- Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Check tokens are being set in cookies
- Verify cookie domain is correct

### "Google OAuth fails"

- Check `GOOGLE_CALLBACK_URL` matches Vercel URL
- Verify callback URL is registered in Google Console
- Check client ID and secret are correct

## Support

For issues:
1. Check Vercel logs
2. Check Supabase logs
3. Review `ENV_SETUP_GUIDE.md`
4. Review `DATABASE_MIGRATION_GUIDE.md`
5. See `/features/techDebt/` for implementation details

