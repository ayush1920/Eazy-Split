# 📋 Changelog v1.2.5

**Release Date**: 2026-01-14
**Version**: 1.2.5
**Type**: Patch Release

---

## 🎯 Overview

This patch fixes the "Model Switch not working" issue on Vercel deployments. We transitioned from server-side file storage (which is read-only on Vercel) to client-side state management for model preferences.

---

## 🐛 Bug Fixes

### Serverless Compatibility
**What Changed**:
- **Client**: Model preferences (`selectedModel`, `autoMode`) are now saved to the browser's `localStorage` instead of the server.
- **API**: The client now sends these preferences with *every* OCR request.
- **Server**: Updated OCR endpoint to read preferences from the request body, bypassing the need for server-side persistence.

**Why**: Vercel Serverless functions have a read-only filesystem (except for `/tmp`), so saving `preferences.json` on the server failed or didn't persist between requests.

**Impact**:
- ✅ Model switching now works instantly and persists across reloads.
- ✅ Auto Mode toggle works correctly on deployed environments.

---

## 📊 Statistics

- **Files Changed**: 5
- **New Features**: 0
- **Bug Fixes**: 1
- **Breaking Changes**: 0
