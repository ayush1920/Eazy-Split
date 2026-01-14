# Quota Testing Scripts

This directory contains test scripts to help understand the actual quota response from the Gemini API.

## Scripts

### 1. `test-quota-response.ts`
Tests the model metadata endpoint to see what quota information is available.

```bash
npx ts-node test-quota-response.ts
```

This will:
- Fetch metadata for all 5 models
- Display the full API response
- Highlight any quota-related fields
- Show all available top-level keys

### 2. `test-quota-error.ts`
Makes a test request to see the response structure and error format.

```bash
npx ts-node test-quota-error.ts
```

This will:
- Make a simple generation request
- Show the successful response structure
- If quota is exceeded, show the error structure

## Expected Findings

The Gemini API typically **does not** expose quota details (RPM, TPM, RPD) via the model metadata endpoint. Quota information is usually only available through:

1. **Error responses** (429 status) when quota is exceeded
2. **Google Cloud Console** quota dashboard
3. **Usage tracking** in your own application

## Alternative Approach

Since real-time quota data may not be available from the API, consider:

1. **Show availability status only** (✓ Available / ✗ Quota exceeded)
2. **Display static quota limits** from Google's documentation
3. **Track usage locally** and estimate remaining quota
4. **Link to Cloud Console** for detailed quota information

## Running the Tests

Make sure your `.env` file has `GEMINI_API_KEY` set, then run:

```bash
cd server
npx ts-node test-quota-response.ts
npx ts-node test-quota-error.ts
```
