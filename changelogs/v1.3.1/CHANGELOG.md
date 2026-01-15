# 📋 Changelog v1.3.1

**Release Date**: 2026-01-15  
**Version**: 1.3.1  
**Type**: Feature Release  
**Parent Version**: v1.3.0

---

## 🎯 Overview

Building onto the batch processing capabilities of v1.3.0, this release introduces seamless clipboard integration. Users can now paste images directly into the upload modal, streamlining the receipt capture workflow significantly on both desktop and mobile devices.

---

## ✨ New Features

### 📋 Clipboard Support

**What Changed**: Added support for pasting images directly from the system clipboard into the Upload Modal.

**Why**: 
- **Desktop**: Users often take screenshots of digital receipts (e.g., from email or web) and want to upload them without saving to a file first.
- **Mobile**: Users copying images from other apps needed a direct way to paste without navigating the file picker.

**Impact**:
- ✅ **Desktop Shortcut**: Press `Ctrl+V` (or Cmd+V) anywhere in the modal to instantly add images from your clipboard.
- ✅ **Mobile Action**: New "Paste from Clipboard" button specifically designed for touch devices where keyboard shortcuts aren't available.
- ✅ **Smart Filtering**: The system automatically detects image content in the clipboard and ignores text or other data types.
- ✅ **Instant Preview**: Pasted images appear immediately in the batch processing queue.

---

## 📊 Statistics

- **Files Changed**: 1 (`upload-modal.tsx`)
- **New Features**: 1 (Clipboard Integration)
- **UI Components**: 1 (Mobile Paste Button)

---

## 🚀 Upgrade Guide

### Prerequisites
- None. This is a purely client-side feature enhancement.

### Steps
1. Pull latest code.
2. No dependency updates required.
3. Refresh the application to load the new JS bundle.

---

## 🔗 References
- **Related Release**: v1.3.0 (Batch Processing)
- **Feature Request**: "add clipboard to image support"
