# 📋 Changelog v1.2.3

**Release Date**: 2026-01-14
**Version**: 1.2.3
**Type**: Patch Release

---

## 🎯 Overview

This release fixes a critical configuration issue where the client was hardcoded to connect to `localhost`. This caused "Local Network Access" permission prompts on deployed environments. The client now correctly respects the `VITE_API_URL` environment variable.

---

## 🐛 Bug Fixes

### API Connection
**What Changed**: Updated `models.ts` and `ocr.ts` to use `import.meta.env.VITE_API_URL`.
**Why**: The client was failing to connect to the deployed server and triggering security warnings by attempting to access `localhost:3000`.
**Impact**:
- ✅ Correct API routing on Vercel
- ✅ "Local Network Access" prompt removed

---

## 📊 Statistics

- **Files Changed**: 2
- **New Features**: 0
- **Bug Fixes**: 1
- **Breaking Changes**: 0
