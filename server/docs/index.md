# Server Documentation - Eazy Split

Welcome to the Eazy Split server documentation. This optional backend provides OCR processing for receipt images using Google's Gemini AI.

## Overview

The server is a lightweight Express API built with:
- **Node.js** + **Express 5.x** for HTTP server
- **TypeScript** for type safety
- **Multer** for file upload handling
- **Google Generative AI SDK** for OCR processing
- **CORS** enabled for cross-origin requests

## Quick Links

- [Backend Architecture](./architecture.md) - Server structure and middleware
- [OCR Service](./ocr_service.md) - Gemini AI integration
- [API Endpoints](./api_endpoints.md) - API reference

## Project Structure

```
server/
├── src/
│   ├── index.ts           # Express server setup
│   ├── routes/
│   │   └── ocr.ts         # OCR endpoints
│   └── services/
│       └── gemini.ts      # Gemini AI service
├── uploads/               # Temporary file storage
├── .env                   # Environment variables
├── package.json
└── tsconfig.json
```

## Key Features

### 1. OCR Processing

Upload receipt images and receive structured JSON:

**Input**: Image file (JPG, PNG)  
**Output**: 
```json
{
  "platform": "Eazy",
  "date": "2026-01-14",
  "items": [
    { "name": "Milk", "price": 48, "quantity": 1 },
    { "name": "Eggs", "price": 120, "quantity": 1 }
  ],
  "total": 168,
  "currency": "INR"
}
```

### 2. Automatic Cleanup

Uploaded images are deleted after processing to save disk space.

### 3. Error Handling

Graceful error responses with proper HTTP status codes.

## Environment Variables

**Required**:
- `GEMINI_API_KEY`: Google Gemini API key ([get key](https://makersuite.google.com/app/apikey))

**Optional**:
- `PORT`: Server port (default: 3000)

**Example `.env`**:
```env
GEMINI_API_KEY=AIzaSyC...your_key_here
PORT=3000
```

## Running the Server

### Development

```bash
npm run dev
```

Starts with nodemon (auto-restart on file changes).

### Production

```bash
npm run build
npm start
```

Compiles TypeScript and runs compiled JavaScript.

## API Usage

### Upload Receipt

```bash
curl -X POST http://localhost:3000/api/ocr \
  -F "image=@receipt.jpg"
```

**Response**:
```json
{
  "platform": "Eazy",
  "date": "2026-01-14",
  "items": [...],
  "total": 168,
  "currency": "INR"
}
```

### Health Check

```bash
curl http://localhost:3000/api/ocr/health
```

**Response**: `OCR Service Running`

## Performance

- **OCR Latency**: 2-5 seconds per image
- **Throughput**: Limited by Gemini API rate limits
- **Memory**: ~50MB per request (image buffering)

## Security Notes

> [!WARNING]
> The server disables SSL verification (`NODE_TLS_REJECT_UNAUTHORIZED = '0'`) for corporate proxy compatibility. Remove this in production.

**Current Security**:
- CORS enabled (allows all origins)
- No authentication
- File cleanup after processing

**Production Recommendations**:
- Add authentication (JWT)
- Restrict CORS to specific origins
- Add rate limiting
- Enable SSL verification
- Add request validation

## Deployment

### Recommended Platforms

- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **Vercel**: Serverless functions
- **AWS/Azure**: Docker or Node.js runtime

### Environment Setup

Ensure `GEMINI_API_KEY` is set in platform environment variables.

## Troubleshooting

### Common Issues

**GEMINI_API_KEY not set**:
- Check `.env` file exists
- Verify API key is valid
- Restart server after adding `.env`

**Port already in use**:
```bash
npx kill-port 3000
```

**OCR processing fails**:
- Check Gemini API quota
- Verify image is clear and well-lit
- Check server logs for detailed error

## References

- [Backend Architecture](./architecture.md)
- [OCR Service](./ocr_service.md)
- [API Endpoints](./api_endpoints.md)
