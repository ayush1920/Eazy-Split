# OCR Service - Gemini AI Integration

## Overview

The OCR service uses Google's Gemini AI to extract structured data from receipt images. It supports multiple models (Gemini 2.0 Flash, 2.5 Flash, etc.) with automatic fallback capabilities.

**Location**: [src/services/gemini.ts](../src/services/gemini.ts)

## Purpose

Convert receipt images into structured JSON containing:
- Platform name (e.g., "Eazy", "Blinkit")
- Date (YYYY-MM-DD format)
- Items with names, prices, and quantities
- Total amount
- Currency

## Function Signature

```typescript
export const processReceiptImage = async (
  filePath: string,
  mimeType: string
): Promise<ReceiptData>
```

**Parameters**:
- `filePath`: Path to uploaded image file
- `mimeType`: Image MIME type (e.g., "image/jpeg")

**Returns**: Parsed receipt data as JSON

## Implementation

### Initialization

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
```

**Environment Variable**: `GEMINI_API_KEY` must be set.

### Model Selection

```typescript
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
```

**Why gemini-2.5-flash-lite?**
- Fast response times (2-5 seconds)
- Good accuracy for structured text
- Cost-effective
- Supports vision (image input)

### Image Encoding

```typescript
const filePart = {
  inlineData: {
    data: fs.readFileSync(filePath).toString("base64"),
    mimeType,
  },
};
```

**Process**:
1. Read image file from disk
2. Convert to base64 string
3. Include MIME type for proper decoding

### Prompt Engineering

```typescript
const prompt = `
  Analyze this receipt image and extract the following information in JSON format:
  1. Platform (e.g., Eazy, Blinkit, Instamart, etc.)
  2. Date (YYYY-MM-DD format)
  3. Items (name and price). strictly numbers for price.
  4. Total Amount
  5. Currency (default INR)

  Return ONLY raw JSON with no markdown formatting. Structure:
  {
    "platform": "string",
    "date": "string",
    "items": [
      { "name": "string", "price": number, "quantity": number (optional, default 1) }
    ],
    "total": number,
    "currency": "string"
  }
`;
```

**Key Instructions**:
- **"ONLY raw JSON"**: Prevents markdown code blocks
- **"strictly numbers for price"**: Avoids currency symbols in output
- **"YYYY-MM-DD format"**: Standardizes date format
- **"default INR"**: Assumes Indian Rupee if not specified

### API Call

```typescript
const result = await model.generateContent([prompt, filePart]);
const response = await result.response;
const text = response.text();
```

**Flow**:
1. Send prompt + image to Gemini API
2. Wait for response (2-5 seconds)
3. Extract text from response

### Response Cleaning

```typescript
const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
return JSON.parse(jsonStr);
```

**Why?** Gemini sometimes wraps JSON in markdown code blocks despite instructions.

**Example**:
```
Input:  ```json\n{"platform": "Eazy"}\n```
Output: {"platform": "Eazy"}
```

### Error Handling

```typescript
try {
  // ... API call
} catch (error) {
  console.error("Gemini API Error:", error);
  throw new Error("Failed to process receipt");
}
```

**Errors**:
- API key invalid
- Rate limit exceeded
- Network timeout
- Invalid image format

## Example Usage

### Input Image

A receipt photo containing:
```
Eazy
Order Date: 14 Jan 2026

Milk (1L)        ₹48
Eggs (12 pack)   ₹120

Total: ₹168
```

### API Call

```typescript
const result = await processReceiptImage(
  '/uploads/abc123.jpg',
  'image/jpeg'
);
```

### Output JSON

```json
{
  "platform": "Eazy",
  "date": "2026-01-14",
  "items": [
    {
      "name": "Milk (1L)",
      "price": 48,
      "quantity": 1
    },
    {
      "name": "Eggs (12 pack)",
      "price": 120,
      "quantity": 1
    }
  ],
  "total": 168,
  "currency": "INR"
}
```

## Accuracy Considerations

### Factors Affecting Accuracy

**Image Quality**:
- ✅ Clear, well-lit photos
- ✅ High resolution (>1MP)
- ❌ Blurry or dark images
- ❌ Partial receipts

**Receipt Format**:
- ✅ Standard retail receipts
- ✅ Digital screenshots
- ❌ Handwritten receipts
- ❌ Heavily formatted layouts

**Language**:
- ✅ English
- ✅ Hindi (mixed with English)
- ❌ Pure regional languages (may require prompt adjustment)

### Common Errors

**1. Incorrect Platform Detection**

**Issue**: "Eazy" detected as "Zomato"

**Solution**: Add platform hints in prompt:
```typescript
"Platform must be one of: Eazy, Blinkit, Instamart, DMart, BigBasket"
```

**2. Date Parsing Failures**

**Issue**: "14 Jan 2026" → "2026-01-14" (correct) vs "Jan 14" → "2026-01-01" (wrong)

**Solution**: Prompt emphasizes YYYY-MM-DD format

**3. Price Extraction**

**Issue**: "₹48.00" → 48.00 (correct) vs "₹48" → "48" (string)

**Solution**: "strictly numbers for price" in prompt

**4. Item Name Truncation**

**Issue**: "Milk (1L Toned)" → "Milk"

**Solution**: Prompt could specify "include full item descriptions"

## Performance

### Latency

- **Typical**: 2-3 seconds
- **Complex receipts**: 4-5 seconds
- **Network issues**: 10+ seconds (timeout)

### Throughput

Limited by Gemini API:
- **Free tier**: 60 requests/minute
- **Paid tier**: Higher limits (check quota)

### Cost

**gemini-2.5-flash-lite pricing** (as of 2026):
- ~$0.001 per request (varies by region)
- Free tier: 1500 requests/day

## Error Scenarios

### 1. API Key Not Set

```typescript
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}
```

**User sees**: 500 error with message "GEMINI_API_KEY is not set"

### 2. Invalid Image

**Cause**: Corrupted file, unsupported format

**Error**: Gemini API throws validation error

**Handling**: Caught and returned as "Failed to process receipt"

### 3. Rate Limit Exceeded

**Cause**: Too many requests in short time

**Error**: Gemini API returns 429 status

**Handling**: Currently not handled (future: retry with backoff)

### 4. Network Timeout

**Cause**: Slow connection, server issues

**Error**: Request timeout

**Handling**: Caught and returned as generic error

## Testing

### Manual Testing

```bash
curl -X POST http://localhost:3000/api/ocr \
  -F "image=@test-receipt.jpg"
```

### Unit Testing (Future)

```typescript
import { processReceiptImage } from './gemini';

jest.mock('@google/generative-ai');

test('processes receipt successfully', async () => {
  const result = await processReceiptImage('test.jpg', 'image/jpeg');
  expect(result.platform).toBe('Eazy');
  expect(result.items).toHaveLength(2);
});
```

## Future Enhancements

### 1. Confidence Scores

Add OCR confidence to items:

```json
{
  "name": "Milk",
  "price": 48,
  "confidence": 0.95
}
```

### 2. Multi-Page Receipts

Handle multiple images for long receipts:

```typescript
const processMultipleImages = async (filePaths: string[]) => {
  const results = await Promise.all(
    filePaths.map(path => processReceiptImage(path, 'image/jpeg'))
  );
  return mergeResults(results);
};
```

### 3. Fallback OCR

Use Tesseract.js as fallback if Gemini fails:

```typescript
try {
  return await processWithGemini(filePath);
} catch (error) {
  return await processWithTesseract(filePath);
}
```

### 4. Caching

Cache results for duplicate images:

```typescript
const imageHash = crypto.createHash('sha256').update(imageData).digest('hex');
const cached = await cache.get(imageHash);
if (cached) return cached;
```

### 5. Prompt Optimization

Fine-tune prompt based on platform:

```typescript
const platformPrompts = {
  Eazy: "Focus on Eazy-specific layout...",
  blinkit: "Focus on Blinkit-specific layout..."
};
```

## References

- [Backend Architecture](./architecture.md)
- [API Endpoints](./api_endpoints.md)
- [Gemini AI Documentation](https://ai.google.dev/docs)
