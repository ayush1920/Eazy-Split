# Client Documentation - Eazy Split

Welcome to the Eazy Split client documentation. This PWA provides a complete receipt splitting experience that runs entirely in your browser.

## Overview

The client is a React-based Progressive Web App built with:
- **React 19.2.0** + **TypeScript** for type-safe UI development
- **Vite** for fast development and optimized builds
- **Zustand** for lightweight state management
- **IndexedDB** for local data persistence
- **Tailwind CSS 4.x** for modern, responsive styling
- **Headless UI** for accessible components

## Quick Links

### Architecture & Design
- [Frontend Architecture](./architecture.md) - Component hierarchy and data flow
- [State Management](./state_management.md) - Zustand stores and patterns
- [Data Persistence](./data_persistence.md) - IndexedDB schema and operations

### Core Features
- [Split Calculation](./split_calculation.md) - Fair division algorithm
- [Export System](./export_system.md) - Text and Markdown export
- [UI Components](./ui_components.md) - React component library
- [Model Selection](./model_selection.md) - AI model configuration
- [PWA Setup](./pwa_setup.md) - Progressive Web App configuration

## Project Structure

```
client/
├── src/
│   ├── components/        # React UI components
│   │   ├── people-manager.tsx
│   │   ├── upload-modal.tsx
│   │   ├── receipt-grid.tsx
│   │   ├── split-preview.tsx
│   │   ├── item-edit-modal.tsx
│   │   ├── theme-provider.tsx
│   │   └── mode-toggle.tsx
│   ├── store/            # Zustand state stores
│   │   ├── usePeopleStore.ts
│   │   └── useReceiptStore.ts
│   ├── lib/              # Utility libraries
│   │   ├── db.ts         # IndexedDB setup
│   │   ├── splitter.ts   # Split calculation
│   │   ├── export.ts     # Export formatting
│   │   ├── ocr.ts        # OCR client
│   │   └── utils.ts      # Helpers
│   ├── types/            # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── docs/                 # Documentation (you are here)
└── package.json
```

## Key Features

### 1. Offline-First Design
All core functionality works without internet:
- Add and manage people
- Create receipts manually
- Assign items to people
- Calculate splits
- Export results

Data is stored locally in IndexedDB and persists across sessions.

### 2. OCR Integration (Optional)
Upload receipt images to the backend for automatic extraction:
- Platform detection
- Date parsing
- Item name and price extraction
- Structured JSON response

See [OCR Client](../src/lib/ocr.ts) for implementation.

### 3. Real-Time Split Calculation
As you assign items to people, totals update instantly:
- Fair division with cent-based math
- Remainder distribution
- Unassigned item tracking
- Grand total validation

See [Split Calculation](./split_calculation.md) for algorithm details.

### 4. Flexible Export
Export splits in multiple formats:
- **Plain Text**: WhatsApp/SMS friendly with emojis
- **Markdown**: Rich formatting for documents

Both formats include item breakdown and per-person totals.

### 5. Modern UI/UX
- **Dark/Light Mode**: System-aware theme switching
- **Responsive**: Mobile-first design
- **Accessible**: Keyboard navigation and screen reader support
- **Animated**: Smooth transitions with Framer Motion
- **Glassmorphism**: Modern aesthetic with backdrop blur

## Data Model

### Core Types

Defined in [src/types/index.ts](../src/types/index.ts):

```typescript
interface Person {
  id: string;
  name: string;
  emoji?: string;
  email?: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  sourceImageId?: string;
}

interface ReceiptGroup {
  id: string;
  platform: string;
  date: string;
  items: Item[];
  tax?: number;
  tip?: number;
  currency: string;
}

interface SplitAssignment {
  itemId: string;
  personIds: string[];
  isAll: boolean;
}
```

## Development Workflow

### Running Locally

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot module replacement.

### Building for Production

```bash
npm run build
```

Output: `dist/` folder ready for static hosting.

### Linting

```bash
npm run lint
```

## Common Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Import and use in parent component
3. Add to [UI Components](./ui_components.md) documentation

### Modifying State

1. Update store in `src/store/`
2. Ensure IndexedDB persistence
3. Update [State Management](./state_management.md) docs

### Changing Data Schema

1. Update types in `src/types/index.ts`
2. Update IndexedDB schema in `src/lib/db.ts`
3. Increment `DB_VERSION` to trigger migration
4. Update [Data Persistence](./data_persistence.md) docs

## Performance Considerations

### Bundle Size
- Current: ~200KB gzipped
- Main dependencies: React, Zustand, IDB, Tailwind

### Optimization Strategies
- Code splitting (if needed for future features)
- Tree shaking (automatic with Vite)
- Image optimization for assets
- Service worker caching (PWA)

### IndexedDB Performance
- Batch operations for multiple items
- Debounced writes (500ms)
- Indexed queries on `id` fields

## Browser Support

### Minimum Requirements
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- ES2020 syntax
- IndexedDB API
- CSS Grid and Flexbox
- CSS Custom Properties
- Backdrop Filter (for glassmorphism)

## Testing

### Manual Testing Checklist
- [ ] Add/edit/remove people
- [ ] Upload receipt (with server running)
- [ ] Manually add receipt items
- [ ] Assign items to people
- [ ] Toggle "All" checkbox
- [ ] Edit item name and price
- [ ] View live split preview
- [ ] Export as plain text
- [ ] Export as markdown
- [ ] Switch dark/light mode
- [ ] Reload page (data persists)
- [ ] Test offline (no server)

### Browser DevTools
- **React DevTools**: Inspect component tree
- **IndexedDB**: Application → IndexedDB → Eazy-split-db
- **Network**: Monitor API calls to server

## Troubleshooting

### State Not Persisting
- Check IndexedDB in DevTools
- Verify `dbPromise` is awaited
- Check browser console for errors

### OCR Not Working
- Ensure server is running on port 3000
- Check CORS configuration
- Verify image upload in Network tab

### Styling Issues
- Clear Tailwind cache: `rm -rf .cache`
- Rebuild: `npm run build`
- Check for CSS conflicts

## Next Steps

Explore the detailed module documentation:
- [Frontend Architecture](./architecture.md)
- [State Management](./state_management.md)
- [Split Calculation](./split_calculation.md)
