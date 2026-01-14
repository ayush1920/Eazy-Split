# 📋 Changelog v1.2.0

**Release Date**: 2026-01-14
**Version**: 1.2.0
**Type**: Feature Release

---

## 🎯 Overview

This release introduces **Model Selection**, giving users control over which Gemini AI model performs the receipt OCR. It also improves reliability with **Auto Fallback** and streamlines the settings UI.

---

## 🚀 New Features

### Model Selection

**What Changed**: Added a dropdown in Settings to choose between available Gemini models (e.g., Gemini 2.0 Flash, 2.5 Flash).

**Why**: Different models offer tradeoffs between speed, cost, and accuracy. Users can now pick the best model for their needs.

**Impact**: 
- ✅ Flexibility to switch models if one is underperforming
- ✅ Future-proofing for new Gemini versions

### Auto Fallback

**What Changed**: Added an "Auto Fallback" toggle. If the selected model hits a rate limit or error, the system automatically retries with the next available model.

**Why**: Ensures receipt processing succeeds even during high traffic or API interruptions.

**Impact**: 
- ✅ Higher success rate for uploads
- ✅ Reduced user frustration

---

## 🔄 Changes

### Quota Display Removal

**What Changed**: Removed the detailed quota statistics (RPM/TPM) from the settings panel.

**Why**: The previous implementation relied on an endpoint that didn't provide real-time accuracy, leading to confusion.

**Impact**: 
- ✅ Cleaner, less clutter UI
- ✅ Removed misleading information

### Documentation Updates

**What Changed**: Added repo-level architecture docs and updated API documentation to include model selection endpoints.

**Impact**: 
- ✅ Better developer experience
- ✅ Clearer system understanding

---

## 📊 Statistics

- **Files Changed**: ~15
- **New Features**: 2
- **Bug Fixes**: 1 (Settings Panel backdrop)
- **Breaking Changes**: 0

---

## 🐛 Known Issues

- None requiring immediate attention.
