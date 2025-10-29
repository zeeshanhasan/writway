# Troubleshooting Claim Questionnaire Analysis

## Issue: Analysis Not Working / Getting Errors

### Quick Checks

1. **Backend Server Running?**
   ```bash
   curl http://localhost:3001/api/v1/health
   ```
   Should return `{"success":true,...}`

2. **Endpoint Accessible?**
   ```bash
   curl -X POST http://localhost:3001/api/v1/claim/analyze \
     -H "Content-Type: application/json" \
     -d '{"description":"Test description with at least 10 characters"}'
   ```
   Should return JSON response (even if error)

3. **OpenAI API Key Set?**
   ```bash
   cd backend
   grep OPENAI_API_KEY .env
   ```
   Should show your API key

### Common Errors & Solutions

#### Error: "Failed to analyze description"

**Possible Causes:**

1. **OpenAI Quota Exceeded**
   - **Symptom**: Error message mentions "quota" or "rate limit"
   - **Solution**: 
     - Go to https://platform.openai.com/account/billing
     - Add credits/payment method
     - Wait a few minutes for quota to refresh
   
2. **Invalid API Key**
   - **Symptom**: Error mentions "API key" or 401 status
   - **Solution**:
     - Check `.env` file has correct key
     - Verify key at https://platform.openai.com/api-keys
     - Restart backend server after updating `.env`

3. **Network/CORS Error**
   - **Symptom**: Browser console shows CORS error or network failure
   - **Solution**:
     - Check backend is running on `http://localhost:3001`
     - Check frontend is calling correct URL (should be from `NEXT_PUBLIC_API_URL`)
     - Verify CORS origin in backend `.env`: `CORS_ORIGIN=http://localhost:3000`

4. **Validation Error**
   - **Symptom**: "Description must be at least 10 characters"
   - **Solution**: Enter at least 10 characters in the description field

#### Error: "Cannot POST /api/v1/claim/analyze"

**Cause**: Route not registered in Express

**Solution**:
1. Check `backend/src/routes/claim.ts` exists
2. Check `backend/src/app.ts` imports and mounts claim router:
   ```typescript
   import { router as claimRouter } from './routes/claim';
   app.use('/api/v1/claim', claimRouter);
   ```
3. Rebuild: `cd backend && npm run build`
4. Restart dev server

### Debugging Steps

#### 1. Check Browser Console

Open browser DevTools (F12) → Console tab, look for:
- Network errors (red)
- API call errors
- CORS errors

#### 2. Check Network Tab

Open DevTools → Network tab:
- Find the `/claim/analyze` request
- Check:
  - **Status**: Should be 200, 400, 500, etc.
  - **Request Payload**: Should have `description` field
  - **Response**: See actual error message

#### 3. Check Backend Logs

Look at terminal running `npm run dev`:
- Should see request logs
- Should see any error messages
- Should see OpenAI API call logs

#### 4. Test Endpoint Directly

```bash
curl -X POST http://localhost:3001/api/v1/claim/analyze \
  -H "Content-Type: application/json" \
  -d '{"description":"I am from Toronto and need to claim $5000 from a contractor who did not finish the work."}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "extracted": {...},
    "missing": [...],
    "ambiguous": [...]
  }
}
```

Or error:
```json
{
  "success": false,
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

### Testing OpenAI Directly

Run the test script:
```bash
cd backend
npx tsx test-openai.ts
```

This will:
- Check if API key is configured
- Test OpenAI connection
- Show specific error messages

### Frontend Error Handling

The frontend now shows detailed error messages:
- **Quota issues**: Links to OpenAI billing
- **API key issues**: Mentions invalid key
- **Network errors**: Shows original error message

Check browser console for full error details.

### Still Not Working?

1. **Restart Everything**:
   ```bash
   # Stop backend (Ctrl+C)
   cd backend
   npm run dev
   
   # Stop frontend (Ctrl+C)
   cd frontend  
   npm run dev
   ```

2. **Check Environment Variables**:
   ```bash
   cd backend
   cat .env | grep -E "(OPENAI|CORS|API_URL)"
   ```

3. **Verify Routes**:
   - Backend: `http://localhost:3001/api/v1/claim/analyze` should return JSON
   - Frontend API URL: Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

4. **Check for TypeScript Errors**:
   ```bash
   cd backend
   npm run build
   ```
   Should compile without errors

### Getting Help

If still stuck, provide:
1. Browser console errors (full error message)
2. Network tab response (status + body)
3. Backend terminal logs
4. Result of `npx tsx test-openai.ts`

