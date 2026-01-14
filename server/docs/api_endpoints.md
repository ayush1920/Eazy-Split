# API Endpoints

## Overview

The Eazy Split server exposes two endpoints for OCR processing and health checks.

**Base URL**: `http://localhost:3000` (development)

## Endpoints

### POST /api/ocr

Upload a receipt image for OCR processing.

**Request**:
- **Method**: POST
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `image` field

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | File | Yes | Receipt image (JPG, PNG) |

**Example (cURL)**:
```bash
curl -X POST http://localhost:3000/api/ocr \
  -F "image=@receipt.jpg"
```

**Example (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/ocr', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response** (200 OK):
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

**Error Responses**:

**400 Bad Request** - No image uploaded:
```json
{
  "error": "No image uploaded"
}
```

**500 Internal Server Error** - Processing failed:
```json
{
  "error": "Failed to process receipt"
}
```

**Implementation**: [src/routes/ocr.ts#L9-24](../src/routes/ocr.ts#L9-L24)

---

### GET /api/ocr/health

Health check endpoint to verify server is running.

**Request**:
- **Method**: GET
- **Parameters**: None

**Example (cURL)**:
```bash
curl http://localhost:3000/api/ocr/health
```

**Success Response** (200 OK):
```
OCR Service Running
```

**Implementation**: [src/routes/ocr.ts#L27-29](../src/routes/ocr.ts#L27-L29)

---

### GET /

Root endpoint (informational).

**Request**:
- **Method**: GET
- **Parameters**: None

**Example**:
```bash
curl http://localhost:3000/
```

**Success Response** (200 OK):
```
Receipt Splitter API is running
```

**Implementation**: [src/index.ts#L19-21](../src/index.ts#L19-L21)

---

### GET /api/models

List all available Gemini models.

**Request**:
- **Method**: GET

**Success Response** (200 OK):
```json
{
  "models": [
    {
      "id": "gemini-2.0-flash",
      "displayName": "Gemini 2.0 Flash",
      "supportsJsonMode": true,
      "priority": 1
    },
    ...
  ]
}
```

---

### GET /api/models/current

Get current model preference.

**Request**:
- **Method**: GET

**Success Response** (200 OK):
```json
{
  "selectedModel": "gemini-2.0-flash",
  "autoMode": true
}
```

---

### POST /api/models/select

Update model preference.

**Request**:
- **Method**: POST
- **Body**: JSON
  ```json
  {
    "model": "gemini-2.5-flash",
    "autoMode": false
  }
  ```

**Success Response** (200 OK): Returns updated preferences.

## Response Schema

### ReceiptData

```typescript
interface ReceiptData {
  platform: string;      // Platform name (e.g., "Eazy", "Blinkit")
  date: string;          // Date in YYYY-MM-DD format
  items: Item[];         // Array of items
  total: number;         // Total amount
  currency: string;      // Currency code (e.g., "INR")
}

interface Item {
  name: string;          // Item name
  price: number;         // Price (numeric, no currency symbol)
  quantity?: number;     // Quantity (optional, default 1)
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Error message here"
}
```

### Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | No image uploaded | Missing `image` field in form data | Include image file in request |
| 500 | GEMINI_API_KEY is not set | Environment variable not configured | Set `GEMINI_API_KEY` in `.env` |
| 500 | Failed to process receipt | Gemini API error, invalid image, or network issue | Check image quality, API key, and network |

## Rate Limiting

**Current**: No rate limiting implemented

**Recommendation**: Add rate limiting in production:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/ocr', limiter);
```

## CORS

**Current**: All origins allowed

```typescript
app.use(cors());
```

**Production**: Restrict to specific origins:

```typescript
app.use(cors({
  origin: 'https://your-client-domain.com'
}));
```

## Authentication

**Current**: No authentication required

**Future**: Add JWT authentication:

```typescript
// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply to routes
router.post('/', authenticate, upload.single('image'), ...);
```

## Testing

### Manual Testing

**Upload Test**:
```bash
curl -X POST http://localhost:3000/api/ocr \
  -F "image=@test-receipt.jpg" \
  -v
```

**Health Check**:
```bash
curl http://localhost:3000/api/ocr/health
```

### Integration Testing (Future)

```typescript
import request from 'supertest';
import app from './index';

describe('POST /api/ocr', () => {
  it('processes receipt successfully', async () => {
    const response = await request(app)
      .post('/api/ocr')
      .attach('image', 'test-receipt.jpg')
      .expect(200);
    
    expect(response.body.platform).toBeDefined();
    expect(response.body.items).toBeInstanceOf(Array);
  });
  
  it('returns 400 when no image provided', async () => {
    const response = await request(app)
      .post('/api/ocr')
      .expect(400);
    
    expect(response.body.error).toBe('No image uploaded');
  });
});
```

## Performance

### Latency

- **OCR Processing**: 2-5 seconds
- **Health Check**: <10ms

### Throughput

Limited by:
- Gemini API rate limits (60 requests/minute on free tier)
- Server resources (CPU, memory)

### Optimization

**Concurrent Requests**: Express handles multiple requests concurrently

**Caching**: Consider caching results for duplicate images (future enhancement)

## Client Integration

### React Example

```typescript
const uploadReceipt = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('http://localhost:3000/api/ocr', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('OCR failed');
    }
    
    const data = await response.json();
    return data; // ReceiptData
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

### Error Handling

```typescript
try {
  const data = await uploadReceipt(file);
  // Success: add to receipt store
  addGroup({
    id: uuidv4(),
    platform: data.platform,
    date: data.date,
    items: data.items.map(item => ({
      id: uuidv4(),
      name: item.name,
      price: item.price
    })),
    currency: data.currency
  });
} catch (error) {
  // Fallback: allow manual entry
  setShowManualEntry(true);
}
```

## Future Enhancements

### 1. Batch Processing

Upload multiple images:

```typescript
router.post('/batch', upload.array('images', 10), async (req, res) => {
  const results = await Promise.all(
    req.files.map(file => processReceiptImage(file.path, file.mimetype))
  );
  res.json(results);
});
```

### 2. Webhook Notifications

Notify client when processing completes:

```typescript
router.post('/', upload.single('image'), async (req, res) => {
  const jobId = uuidv4();
  res.json({ jobId, status: 'processing' });
  
  // Process asynchronously
  processReceiptImage(req.file.path, req.file.mimetype)
    .then(result => {
      // Send webhook to client
      fetch(req.body.webhookUrl, {
        method: 'POST',
        body: JSON.stringify({ jobId, result })
      });
    });
});
```

### 3. Result Caching

Cache OCR results:

```typescript
router.get('/result/:jobId', async (req, res) => {
  const result = await cache.get(req.params.jobId);
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.json(result);
});
```

## References

- [Backend Architecture](./architecture.md)
- [OCR Service](./ocr_service.md)
- [Client OCR Integration](../../client/src/lib/ocr.ts)
