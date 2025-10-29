# Quick Fix: "Failed to fetch" Error

## Issue Fixed ✅

Your frontend was pointing to production API (`https://api.writway.com`) instead of localhost.

**Fixed**: Updated `.env.local` to use `http://localhost:3001/api/v1`

## Next Step Required ⚠️

**You MUST restart the frontend dev server** for the environment variable change to take effect:

1. Stop the frontend server (Ctrl+C in the terminal running `npm run dev`)
2. Restart it:
   ```bash
   cd frontend
   npm run dev
   ```

3. Refresh your browser and try the claim form again

## Verify It's Working

After restarting, test:
1. Go to `http://localhost:3000/claim`
2. Enter a description (at least 10 characters)
3. Click "Continue"

You should now see either:
- ✅ Analysis working (if OpenAI quota is OK)
- ⚠️ Specific error about OpenAI quota (if quota exceeded)

But NO MORE "Failed to fetch" errors!

