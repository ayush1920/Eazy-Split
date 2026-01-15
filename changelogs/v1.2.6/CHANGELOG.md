# 📋 Changelog v1.2.6

**Release Date**: 2026-01-15  
**Version**: 1.2.6  
**Type**: Patch Release

---

## 🎯 Overview

This release includes important performance improvements, design system standardization, and mobile UX enhancements. Key changes include async file I/O for better server performance, design token migration for theme consistency, and improved mobile touch targets.

---

## ⚡ Performance Improvements

### Async File I/O for Preferences

**What Changed**: Converted preference storage from synchronous (`fs.writeFileSync`) to asynchronous (`fs/promises`) file operations.

**Why**: Blocking file I/O halts the entire Node.js event loop, causing the server to freeze during preference saves. This is especially problematic under load or on slow filesystems.

**Impact**: 
- ✅ Server remains responsive during preference operations
- ✅ Better performance under concurrent requests
- ✅ Non-blocking I/O prevents request queuing
- ✅ Improved error handling with async/await pattern

**Technical Details**:
- `server/src/storage/preferenceStore.ts`: Migrated to `fs/promises` API
- `server/src/routes/models.ts`: Updated routes to handle async preference operations
- All functions now return Promises for proper async flow

---

## ♻️ Refactoring

### Design Token Migration

**What Changed**: Replaced all hardcoded `#FD366E` (pink) color values with Tailwind CSS design tokens (`primary`, `primary-foreground`).

**Why**: Using design tokens ensures consistent theming across the application and makes future color scheme changes easier to manage.

**Impact**: 
- ✅ Improved maintainability - color changes now happen in one place (Tailwind config)
- ✅ Better theme consistency across components
- ✅ Easier to implement future theme variants (e.g., different brand colors)

**Files Affected**:
- Settings Panel: Button borders, focus rings, toggle switch, dropdown selections
- Upload Modal: Primary button, hover states, dropdown selections, cancel button borders
- All other components: Standardized to use theme variables

### CSS Performance Optimization

**What Changed**: Removed expensive wildcard transition from `index.css`.

**Why**: Wildcard transitions (`*`) apply to every element, causing unnecessary repaints and performance overhead.

**Impact**:
- ✅ Reduced CSS overhead
- ✅ Faster page rendering
- ✅ More targeted transitions only where needed

---

## ⭐ Enhancements

### Mobile Responsiveness

**What Changed**: 
1. Increased form input font size to 16px on mobile devices
2. Increased tap targets for checkboxes and icon buttons

**Why**: 
- iOS Safari automatically zooms when input font-size < 16px, disrupting UX
- Small touch targets (< 44x44px) are difficult to tap accurately on mobile

**Impact**:
- ✅ No unwanted zoom on iOS when focusing inputs
- ✅ Better mobile UX for platform and date selection
- ✅ Text scales from `text-base` (16px) on mobile to `text-sm` (14px) on desktop
- ✅ Improved accessibility with larger, easier-to-tap buttons and checkboxes

### UI Polish

**What Changed**: Enhanced close button in upload modal with hover background and padding.

**Why**: Improve visual feedback and touch target size for better usability.

**Impact**:
- ✅ More intuitive close button interaction
- ✅ Better accessibility with larger touch target

---

## 📊 Statistics

- **Files Changed**: 10
- **Lines Added**: ~46
- **Lines Removed**: ~32
- **New Features**: 0
- **Bug Fixes**: 0
- **Breaking Changes**: 0
- **Performance Improvements**: 2

---

## 🚀 Upgrade Guide

### Prerequisites
- None - this is a drop-in replacement
- Node.js environment with async/await support (Node 7.6+)

### Steps
1. Pull latest changes
2. No configuration changes needed
3. Server will automatically use async file operations
4. Application will automatically use new design tokens

### Rollback Plan
If needed, revert to v1.2.5:
```bash
git checkout v1.2.5
npm install
```

---

## 🔗 References

- Previous Version: v1.2.5
- Related: Tailwind CSS v4 design token system
- Related: Node.js fs/promises API

---

**Contributors**: Google Jules Automation
