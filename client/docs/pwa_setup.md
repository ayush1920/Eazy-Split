# PWA Setup

## Overview

Eazy Split is configured as a Progressive Web App (PWA), enabling installation on devices and offline capabilities.

## Current Status

> [!NOTE]
> PWA features are partially implemented. The app has a manifest file but service worker caching is not yet configured.

## Manifest File

**Location**: [public/manifest.json](../public/manifest.json) (if exists)

**Typical Configuration**:
```json
{
  "name": "Eazy Split",
  "short_name": "Split",
  "description": "Split grocery receipts among friends",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f472b6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Service Worker

**Status**: Not yet implemented

**Future Implementation** (using Workbox):

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Eazy Split',
        short_name: 'Split',
        theme_color: '#f472b6'
      }
    })
  ]
});
```

## Offline Capabilities

### Current Offline Support

- **IndexedDB**: All data persists locally
- **Static Assets**: Cached by browser
- **Core Features**: Work without internet

### Missing Offline Features

- **Service Worker Caching**: App shell not cached
- **Background Sync**: OCR requests not queued when offline

## Installation

### Desktop (Chrome)

1. Visit app URL
2. Click install icon in address bar
3. App opens in standalone window

### Mobile (Android)

1. Visit app URL
2. Tap "Add to Home Screen" in browser menu
3. App icon appears on home screen

### Mobile (iOS)

1. Visit app URL in Safari
2. Tap Share button
3. Select "Add to Home Screen"

## Future Enhancements

### 1. Service Worker Caching

Cache app shell for instant loading:

```typescript
// Cache strategy
workbox.routing.registerRoute(
  ({request}) => request.destination === 'document',
  new workbox.strategies.NetworkFirst()
);
```

### 2. Background Sync

Queue OCR requests when offline:

```typescript
// Register sync
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('sync-ocr-queue');
});
```

### 3. Push Notifications

Notify users of split updates (if multi-device sync implemented):

```typescript
// Request permission
Notification.requestPermission();
```

### 4. App Shortcuts

Add quick actions to app icon:

```json
{
  "shortcuts": [
    {
      "name": "Add Receipt",
      "url": "/?action=add",
      "icons": [{"src": "/add-icon.png", "sizes": "192x192"}]
    }
  ]
}
```

## References

- [PWA Documentation (MDN)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Workbox](https://developers.google.com/web/tools/workbox)
