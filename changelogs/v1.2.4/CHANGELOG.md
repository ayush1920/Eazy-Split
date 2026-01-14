# 📋 Changelog v1.2.4

**Release Date**: 2026-01-14
**Version**: 1.2.4
**Type**: Patch Release

---

## 🎯 Overview

This is a critical patch to fully resolve the "Local Network Access" permission prompt on Vercel. While v1.2.3 introduced environment variables, the fallback to `localhost` was still active if the variable was missing. unique to production builds.

---

## 🐛 Bug Fixes

### Production Config
**What Changed**: The API client now explicitly checks `import.meta.env.PROD`. If true, it helps prevent defaulting to `localhost`.
**Why**: Browsers flag connection attempts to `localhost` from public HTTPS sites as a security risk, triggering permission prompts.
**Impact**:
- ✅ Eliminates permission prompt in production
- ✅ Fails gracefully (instead of alerting) if API URL is missing

---

## 📊 Statistics

- **Files Changed**: 2
- **New Features**: 0
- **Bug Fixes**: 1
- **Breaking Changes**: 0
