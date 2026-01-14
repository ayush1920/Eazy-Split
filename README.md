# Eazy Split

**Eazy Split** is a modern, offline-first Progressive Web App (PWA) designed to make splitting grocery and delivery receipts effortless. It features a privacy-focused architecture where all data lives on your device, with an optional backend service for AI-powered receipt scanning.

## 📚 Documentation

We have comprehensive documentation available for developers:

- **[Getting Started](./docs/getting_started.md)**: Installation, setup, and running the project
- **[System Architecture](./docs/architecture.md)**: High-level design, data flow, and diagrams
- **[Client Documentation](./client/docs/index.md)**: Frontend architecture, state management, and algorithms
- **[Server Documentation](./server/docs/index.md)**: Backend API, OCR service, and endpoints

## ✨ Key Features

- **Offline-First**: Full functionality without internet access using IndexedDB.
- **Privacy-Centric**: Your data stays on your device.
- **Smart Scanning**: Optional AI-powered OCR using Google Gemini (requires server).
- **Flexible Splitting**: Algorithm handles complex splits, ensuring every cent is accounted for.
- **Cross-Platform**: Works as a PWA on iOS, Android, and Desktop.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Eazy_split
   ```

2. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install Server Dependencies** (Optional, for OCR)
   ```bash
   cd ../server
   npm install
   ```

### Running the App

**Client Only** (Development):
```bash
cd client
npm run dev
```
Visit http://localhost:5173

**Full Stack** (with OCR support):
1. Create `.env` in `server/` and add `GEMINI_API_KEY=your_key`
2. Run server:
   ```bash
   cd server
   npm run dev
   ```
3. Run client:
   ```bash
   cd client
   npm run dev
   ```

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, IndexedDB
- **Backend**: Node.js, Express, Multer
- **AI**: Google Gemini 2.5 Flash Lite

---

For detailed technical changes and updates, check out the [Changelog](./changelogs/v1.1.0/CHANGELOG.md).
