# OpenAI Integration Configuration & Prompts

## Overview

This document describes where OpenAI is configured, what models are used, and how the prompts are structured.

## Configuration Location

### Main Configuration File
**`backend/src/integrations/openai/openai.client.ts`**

This is the primary configuration file containing:
- OpenAI client initialization
- Model selection
- Timeout and retry settings
- All prompts/prompts

---

## Current Configuration

### API Settings
- **Timeout**: 30 seconds (`DEFAULT_TIMEOUT = 30000`)
- **Max Retries**: 3 attempts (`MAX_RETRIES = 3`)
- **API Key**: Loaded from `process.env.OPENAI_API_KEY`

### Model Used
**Model**: `gpt-4o-mini`

- **Why this model?** Cost-effective for structured data extraction tasks
- **Performance**: Good balance of accuracy and cost
- **Used for**:
  - Data extraction from claim descriptions
  - Dynamic question generation
  - Statement of Claim generation

---

## Prompts & Instructions

### 1. Claim Data Extraction Prompt

**Location**: `backend/src/integrations/openai/openai.client.ts` (lines 44-51)

**Function**: `extractClaimData()`

**System Prompt**:
```
You are a legal assistant helping extract structured data from claim descriptions for Ontario Small Claims Court.
Analyze the description and extract all information you can identify. Return a JSON object with:
- "extracted": object with all fields you found
- "missing": array of field names that are clearly not mentioned
- "ambiguous": array of {field, reason, question} for fields that are unclear or need clarification
Be thorough but only mark as missing if truly absent. Mark as ambiguous if there's any uncertainty.
```

**Configuration**:
- **Temperature**: `0.3` (lower = more consistent, less creative)
- **Response Format**: `json_object` (structured output)
- **Model**: `gpt-4o-mini`

**User Input**: The claim description provided by the user

---

### 2. Question Generation Prompt

**Location**: `backend/src/integrations/openai/openai.client.ts` (lines 107-115)

**Function**: `generateQuestion()`

**System Prompt**:
```
You are a legal assistant creating clear, concise questions for claim forms.
Generate a single question to clarify the missing field. Return JSON with:
- "question": the question text
- "type": "text" | "number" | "date" | "select" | "boolean" | "textarea"
- "options": array if type is "select"
Keep questions simple and user-friendly.
```

**Configuration**:
- **Temperature**: `0.7` (higher = more varied phrasing)
- **Response Format**: `json_object`
- **Model**: `gpt-4o-mini`

**User Input**: Field name, context, and original description

---

### 3. Statement of Claim Generation Prompt

**Location**: `backend/src/integrations/openai/openai.client.ts` (lines 151-157)

**Function**: `generateStatementOfClaim()`

**System Prompt**:
```
You are a legal assistant drafting Statement of Claim paragraphs for Ontario Small Claims Court.
Write a clear, professional statement in legal language that summarizes the claim based on the provided information.
Keep it concise but complete, following standard legal document formatting.
```

**Configuration**:
- **Temperature**: `0.5` (balanced for legal writing)
- **Model**: `gpt-4o-mini`

**User Input**: Complete claim data (JSON stringified)

---

## Field Mapping

### Where Questions Are Mapped

**Location**: `backend/src/services/claim.service.ts`

The service contains a `FIELD_QUESTIONS` object (starting around line 21) that maps field paths to question metadata:

```typescript
const FIELD_QUESTIONS: Record<string, FieldMapping> = {
  'eligibility.totalAmount': {
    field: 'eligibility.totalAmount',
    questionId: 'q-eligibility-amount',
    type: 'number',
    label: 'What is the total amount you are claiming (including any interest or costs)?',
    required: true,
  },
  // ... more mappings
};
```

This mapping determines:
- Which questions to ask
- Question types (text, number, date, select, boolean, textarea)
- Labels and descriptions
- Required vs optional fields

---

## Response Structures

### Extraction Response

**Location**: `backend/src/integrations/openai/openai.types.ts`

```typescript
interface OpenAIExtractionResponse {
  extracted: {
    // All extractable fields (eligibility, plaintiff, defendant, etc.)
  };
  missing: string[]; // Field names that need clarification
  ambiguous: Array<{
    field: string;
    reason: string;
    question: string;
  }>;
}
```

---

## Environment Setup

### Required Environment Variable

**File**: `.env` (in `/backend` directory)

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Setup Instructions**: See `backend/ENV_SETUP_GUIDE.md`

---

## Testing the Integration

### Test Script

**Location**: `backend/test-openai.ts`

Run the test script to verify OpenAI is working:

```bash
cd backend
npx tsx test-openai.ts
```

This script will:
1. Check if API key is configured
2. Test a sample claim description
3. Display extraction results
4. Show any errors (quota, rate limits, etc.)

---

## Error Handling

### Common Errors & Solutions

**429 Rate Limit / Quota Exceeded**:
- **Cause**: No credits/quota in OpenAI account
- **Solution**: Add billing/credits to OpenAI account
- **Handled in**: `openai.client.ts` line 79-82

**401 Invalid API Key**:
- **Cause**: API key is incorrect or revoked
- **Solution**: Generate new API key from OpenAI dashboard
- **Handled in**: `openai.client.ts` line 83-85

**Timeout**:
- **Cause**: Request takes longer than 30 seconds
- **Solution**: Increase `DEFAULT_TIMEOUT` or check network
- **Configuration**: Line 9 in `openai.client.ts`

---

## Cost Tracking

The integration logs token usage and cost estimates:

**Location**: `openai.client.ts` line 69-73

```typescript
console.log(`OpenAI usage - tokens: ${usage.total_tokens}, cost estimate: ~$${...}`);
```

**Current Model Pricing** (gpt-4o-mini):
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens

---

## Customization

### Changing the Model

To use a different model (e.g., `gpt-4` or `gpt-4-turbo`):

1. Edit `backend/src/integrations/openai/openai.client.ts`
2. Change `model: 'gpt-4o-mini'` to your desired model
3. Update cost estimates in logging if needed

### Adjusting Temperature

- **Lower (0.1-0.3)**: More consistent, deterministic responses
- **Medium (0.4-0.7)**: Balanced for most tasks
- **Higher (0.8-1.0)**: More creative, varied responses

Current settings:
- Extraction: `0.3` (consistent data extraction)
- Question Generation: `0.7` (varied phrasing)
- Statement Generation: `0.5` (balanced legal writing)

### Modifying Prompts

All prompts are in `openai.client.ts`:
1. Find the function (extractClaimData, generateQuestion, etc.)
2. Modify the `content` field in the system message
3. Rebuild: `npm run build`
4. Restart the server

---

## API Endpoints Using OpenAI

1. **POST `/api/v1/claim/analyze`**
   - Uses: `extractClaimData()`
   - Analyzes user description

2. **POST `/api/v1/claim/questions/next`**
   - Uses: Field mapping logic (not OpenAI directly)
   - Determines next question based on missing fields

3. **POST `/api/v1/claim/generate`**
   - Uses: Document generation (currently not using OpenAI, but could use `generateStatementOfClaim()`)

---

## Related Files

- **Client Implementation**: `backend/src/integrations/openai/openai.client.ts`
- **Type Definitions**: `backend/src/integrations/openai/openai.types.ts`
- **Service Layer**: `backend/src/services/claim.service.ts`
- **API Endpoints**: `backend/api/v1/claim/*.ts`
- **Test Script**: `backend/test-openai.ts`
- **Environment Setup**: `backend/ENV_SETUP_GUIDE.md`

---

## Security Notes

- ✅ API key stored in environment variables (not in code)
- ✅ `.env` file is git-ignored
- ✅ Error messages don't expose API key
- ✅ Rate limiting handled gracefully
- ⚠️ Token usage is logged (for monitoring, not security risk)

---

## Next Steps

If you need to:
- **Change the model**: Edit `openai.client.ts`, update model name
- **Adjust prompts**: Edit system messages in `openai.client.ts`
- **Add new fields**: Update `FIELD_QUESTIONS` in `claim.service.ts`
- **Change temperature**: Modify temperature values in `openai.client.ts`

