---
title: Model Selection
component: client
path: src/components/settings-panel.tsx
date: 2026-01-14
author: Antigravity
---

# Model Selection

## Purpose

Allows users to choose which Gemini model to use for OCR processing and toggle auto-fallback behavior. This gives users control over accuracy vs. speed and helps manage quota limits.

## Where it lives

- **UI Component**: `src/components/settings-panel.tsx`
- **Store**: `src/store/useModelStore.ts`
- **API Client**: `src/lib/models.ts`

## Features

1.  **Model Dropdown**: Lists available models fetched from server.
2.  **Auto Fallback**: Toggle to enable/disable automatic fallback to next available model on quota errors.
3.  **Persistence**: Preferences are saved to server-side filesystem via `/api/models/select`.

## Data Flow

1.  **Initialization**:
    - `SettingsPanel` mounts.
    - Fetches available models (`GET /api/models`).
    - Fetches current preferences (`GET /api/models/current`).
    - Hydrates `useModelStore`.

2.  **User Interaction**:
    - User selects model -> calls `updateModelPreference` -> updates UI + Server.
    - User toggles auto mode -> calls `updateModelPreference` -> updates UI + Server.

3.  **OCR Request**:
    - When uploading image, `ocr.ts` (client) attaches the preferred model ID to the request logic (implicitly handled by server preference, or explicitly sent if required - currently server uses stored preference).

## Key Configs

- **Default Model**: `gemini-2.0-flash` (server-side default).
- **Auto Mode**: Enabled by default.

## Failure Modes

- **Backend Offline**: Settings panel will fail to load models (API error).
- **Preference Save Fail**: Network error or server Write permission error (500). UI stays in previous state or shows check failure.
