# 🔧 Implementation Summary v1.2.0

**Technical Documentation for Developers**

---

## 📑 Table of Contents

1. [Architecture Changes](#architecture-changes)
2. [File-by-File Changes](#file-by-file-changes)
3. [API Changes](#api-changes)
4. [technical-debt--future-work](#technical-debt--future-work)

---

## 🏗️ Architecture Changes

### Model Preference Persistence
Moved from client-side only (localStorage) to server-side persistence via JSON file (`storage/preferences.json`). This ensures the server always knows the preferred model for OCR requests without needing it sent in every request payload.

---

## 📝 File-by-File Changes

### Backend

#### `server/src/routes/models.ts`
- **New**: Added Endpoints for model management.
- `GET /`: List models.
- `GET /current`: Get current preference.
- `POST /select`: Update preference.

#### `server/src/storage/preferenceStore.ts`
- **New**: Handles reading/writing `preferences.json` safely.
- **Refactor**: Renamed from `preferences.ts` to avoid module resolution conflicts.

#### `server/src/services/gemini.ts`
- **Modified**: `processReceiptImage` now accepts `modelId` and `attemptFallback` parameters.
- **Logic**: Uses `modelId` to initialize Gemini client. Implements recursive fallback logic on 429 errors.

### Frontend

#### `client/src/components/settings-panel.tsx`
- **Modified**: Removed Quota UI. Added Model Dropdown and Fallback Switch.
- **Fix**: Used `createPortal` for Settings Panel to fix `backdrop-filter` z-index issues.

#### `client/src/store/useModelStore.ts`
- **Modified**: Simplified store to sync with backend preferences instead of local state.

---

## 🔌 API Changes

### New APIs

```typescript
// GET /api/models
// Returns list of available models

// POST /api/models/select
// Body: { model: string, autoMode: boolean }
```

### Removed APIs

- `GET /api/models/quota`: Removed as quota checking was deprecated.

---

## 🎯 Technical Debt & Future Work

### Future Improvements

1.  **Per-Request Model Selection**: Currently, the preference is global. Future updates could allow passing `modelId` per upload request.
2.  **Rate Limiting**: Add true rate limiting to endpoints using `express-rate-limit`.
