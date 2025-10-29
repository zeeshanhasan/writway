# CORS Fix for Claim API Endpoints

## Issue
CORS error when frontend (https://www.writway.com) tries to call backend API (https://api.writway.com/api/v1/claim/*)

Error: `Access to fetch at 'https://api.writway.com/api/v1/claim/analyze' from origin 'https://www.writway.com' has been blocked by CORS policy`

## Root Cause
Serverless functions in `backend/api/v1/claim/*.ts` are standalone functions that don't use Express middleware, so CORS headers weren't being set.

## Fix Applied
Added CORS headers manually to all three claim endpoints:
- `/api/v1/claim/analyze`
- `/api/v1/claim/questions/next`
- `/api/v1/claim/generate`

Each endpoint now:
1. Reads `CORS_ORIGIN` environment variable
2. Checks if request origin is in allowed list
3. Sets `Access-Control-Allow-Origin` header
4. Handles OPTIONS preflight requests

## Required Environment Variable in Vercel

**Critical:** Ensure `CORS_ORIGIN` is set in Vercel backend project (`ww-api`):

```
CORS_ORIGIN=https://www.writway.com,https://api.writway.com
```

### How to Set/Verify in Vercel:

1. Go to: https://vercel.com/zeeshan-hasans-projects/ww-api/settings/environment-variables
2. Check if `CORS_ORIGIN` exists
3. Value should be: `https://www.writway.com,https://api.writway.com`
4. If missing, add it for **Production** environment
5. Redeploy after adding/updating

## Testing

After deployment and env var verification, test:
```bash
curl -X OPTIONS \
  -H "Origin: https://www.writway.com" \
  -H "Access-Control-Request-Method: POST" \
  -v https://api.writway.com/api/v1/claim/analyze
```

Should see: `Access-Control-Allow-Origin: https://www.writway.com`

