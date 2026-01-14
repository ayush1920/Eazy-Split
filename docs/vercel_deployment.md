# Vercel Deployment Guide

This guide details how to deploy **Eazy Split** to Vercel using a monorepo setup (separate projects for Client and Server).

## Prerequisites

- A [Vercel](https://vercel.com) account.
- A GitHub account connected to Vercel.
- The **Eazy Split** repository pushed to your GitHub.
- A **Google Gemini API Key** (Get one [here](https://aistudio.google.com/app/apikey)).

## Architecture Overview

The project consists of two parts:
1.  **Client (`/client`)**: A React Vite PWA.
2.  **Server (`/server`)**: A Node.js Express server adapted for serverless execution.

We will deploy them as **two separate Vercel projects** to ensure proper build configurations and environment variable management.

---

## Part 1: Deploying the Client

1.  **Import Project**:
    - Go to your Vercel Dashboard.
    - Click **"Add New..."** -> **"Project"**.
    - Select your `Eazy-Split` repository.

2.  **Configure Project**:
    - **Project Name**: `eazy-split-client` (or your preference).
    - **Framework Preset**: Verify it selects **Vite**.
    - **Root Directory**: Click "Edit" and select `client`.

3.  **Environment Variables**:
    - Skip this for now. We will come back to add the Server URL later.

4.  **Deploy**:
    - Click **"Deploy"**.
    - Wait for the build to complete.
    - Note the **Deployment URL** (e.g., `https://eazy-split-client.vercel.app`).

---

## Part 2: Deploying the Server

1.  **Import Project** (Again):
    - Go back to Vercel Dashboard.
    - Click **"Add New..."** -> **"Project"**.
    - Select the **SAME** `Eazy-Split` repository again.

2.  **Configure Project**:
    - **Project Name**: `eazy-split-server` (or your preference).
    - **Framework Preset**: Vercel should detect `Other` or `Node.js`.
    - **Root Directory**: Click "Edit" and select `server`.

3.  **Environment Variables**:
    - Expand the **Environment Variables** section.
    - Add:
        - `GEMINI_API_KEY`: Paste your actual API key.

4.  **Deploy**:
    - Click **"Deploy"**.
    - Wait for the build.
    - Note the **Server URL** (e.g., `https://eazy-split-server.vercel.app`).

---

## Part 3: Linking Them

Now that both are deployed, we need to tell the Client where the Server is.

1.  Go to the **Client Project** Settings on Vercel.
2.  Navigate to **Environment Variables**.
3.  Add:
    - Key: `VITE_API_URL`
    - Value: The **Server URL** from Part 2 (e.g., `https://eazy-split-server.vercel.app`).
        - *Note: Do not add a trailing slash.*
4.  **Redeploy Client**:
    - Go to the **Deployments** tab.
    - Click the three dots on the latest deployment -> **Redeploy**.
    - This is necessary to bake the new env var into the Vite build.

## Verification

1.  Open your **Client URL**.
2.  Go to **Settings** (Gear Icon).
3.  Click "Refresh Quota".
4.  If the quota updates (or errors with a logical message like "Quota exceeded"), the connection is working!

## Troubleshooting

-   **Server 404 / Cannot GET /**: The server root `/` might not have a route. Try `/api/ocr/health`.
-   **CORS Errors**: The server is configured to accept requests from any origin (`*`) by default. If you restricted this in `index.ts`, ensure your Client URL is allowed.
-   **500 Errors**: Check the **Server Project Logs** in Vercel. It usually indicates a missing API key or a code crash.
-   **File Upload Issues**: The server uses memory storage (`multer.memoryStorage()`) on Vercel. Large files might hit Vercel's payload limits (4.5MB for serverless functions). Keep images optimized.
