# UI Components

## Overview

Eazy Split uses React functional components with TypeScript, Headless UI for accessible dialogs, and Tailwind CSS for styling.

## Component Library

### PeopleManager

**Location**: [src/components/people-manager.tsx](../src/components/people-manager.tsx)

**Purpose**: Add, view, and remove people for splitting receipts.

**Features**:
- Modal dialog (Headless UI Dialog)
- Add person with name input
- List all people with avatar initials
- Remove person button
- Loads people from IndexedDB on mount

**State**: Connected to `usePeopleStore`

**UI Pattern**: Button → Modal → Form + List

---

### UploadModal

**Location**: [src/components/upload-modal.tsx](../src/components/upload-modal.tsx)

**Purpose**: Upload receipt images or create manual receipts.

**Features**:
- File upload (drag-drop or click)
- Platform selection (text input with suggestions)
- Date picker (native input type="date")
- OCR processing via server API
- Manual item entry fallback
- Loading states during OCR
- **Clipboard Support**: Paste receipt images directly (Ctrl+V on desktop, dedicated button on mobile)

**State**: Connected to `useReceiptStore`

**API Integration**: Calls `/api/ocr` endpoint with multipart form data

---

### ReceiptGrid

**Location**: [src/components/receipt-grid.tsx](../src/components/receipt-grid.tsx)

**Purpose**: Display and edit receipt items in a grid layout.

**Features**:
- Groups receipts by platform + date
- Editable item rows (click to edit)
- Person checkboxes for assignment
- "All" checkbox for quick assignment
- Add/remove items
- Delete entire group
- Responsive grid layout

**State**: Connected to `useReceiptStore` and `usePeopleStore`

**Interactions**:
- Click item → Opens ItemEditModal
- Toggle checkbox → Updates split assignment
- Add item → Adds to group
- Delete group → Removes from store

---

### SplitPreview

**Location**: [src/components/split-preview.tsx](../src/components/split-preview.tsx)

**Purpose**: Live preview of per-person totals and export actions.

**Features**:
- Real-time calculation using `calculateSplits()`
- Per-person breakdown with amounts
- Unassigned items warning
- Grand total display
- Export buttons (text/markdown)
- Clipboard API integration

**State**: Reads from `useReceiptStore` and `usePeopleStore`

**Export**: Uses `generateExportText()` from [src/lib/export.ts](client/src/lib/export.ts)

---

### ItemEditModal

**Location**: [src/components/item-edit-modal.tsx](../src/components/item-edit-modal.tsx)

**Purpose**: Edit item name and price inline.

**Features**:
- Modal dialog with form
- Name input (text)
- Price input (number)
- Save/cancel buttons
- Updates group in store

**State**: Connected to `useReceiptStore`

---

### Theme Architecture

**Design System**: "Appwrite Inspired"
- **Primary Color**: Vibrant Pink `#FD366E`
- **Dark Mode**: "Deep Dark" `#0E0E10` (not pure black)
- **Light Mode**: "Clean White` `#FFFFFF` (high contrast)
- **Typography**: System fonts with precise tracking

**Implementation**:
- CSS Variables in `index.css` define the theme tokens
- `ModeToggle` component switches between system/light/dark preferences
- Interactive elements use `hover:scale-[1.02]` for tactile feel

### Recent Enhancements

#### Multi-Receipt Upload Modal
- **Upload**: Drag & drop or file selection support for multiple receipt images
- **Review Step**: Verify and edit receipt details (Platform, Date) before saving
- **UI**: Uses Headless UI `Dialog` and `Transition` for smooth animations
- **Smart Defaults**:
  - Date defaults to current browser date
  - Custom `Listbox` dropdown for platform selection
- **Clipboard Integration**:
  - Global Paste listener for desktop workflow
  - Mobile-specific button using Clipboard API
  - Auto-detection of image content types

#### People Manager
- **Interactive**: Add/Remove people with instant UI feedback
- **Visuals**: Emoji support for avatars

---

### ThemeProvider

**Location**: [src/components/theme-provider.tsx](../src/components/theme-provider.tsx)

**Purpose**: Provide theme context (dark/light/system) to entire app.

**Features**:
- React Context API
- localStorage persistence
- System preference detection
- Theme switching

**Usage**:
```typescript
<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
  <App />
</ThemeProvider>
```

---

### ModeToggle

**Location**: [src/components/mode-toggle.tsx](../src/components/mode-toggle.tsx)

**Purpose**: Toggle between dark and light themes.

**Features**:
- Sun/Moon icon toggle
- Uses ThemeProvider context
- Smooth transitions

## Common Patterns

### Modal Dialogs

All modals use Headless UI `Dialog` component:

```typescript
import { Dialog, Transition } from '@headlessui/react';

<Transition show={isOpen}>
  <Dialog onClose={() => setIsOpen(false)}>
    <Dialog.Panel>
      {/* Content */}
    </Dialog.Panel>
  </Dialog>
</Transition>
```

**Benefits**:
- Accessible (ARIA attributes)
- Keyboard navigation (Escape to close)
- Focus management
- Smooth animations

### Form Handling

Forms use controlled inputs with React state:

```typescript
const [value, setValue] = useState('');

<form onSubmit={handleSubmit}>
  <input 
    value={value}
    onChange={(e) => setValue(e.target.value)}
  />
</form>
```

### Store Integration

Components subscribe to specific state slices:

```typescript
const people = usePeopleStore(state => state.people);
const addPerson = usePeopleStore(state => state.addPerson);
```

## Styling

### Tailwind CSS

All components use Tailwind utility classes:

```typescript
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
  Click Me
</button>
```

### Theme Variables

CSS custom properties for theming:

```css
.bg-background /* Uses --background */
.text-foreground /* Uses --foreground */
.border-border /* Uses --border */
```

### Responsive Design

Mobile-first breakpoints:

```typescript
<div className="grid grid-cols-1 lg:grid-cols-2">
  {/* Stacks on mobile, 2 columns on large screens */}
</div>
```

## Accessibility

- **Keyboard Navigation**: All interactive elements focusable
- **ARIA Labels**: Buttons and inputs have descriptive labels
- **Screen Readers**: Semantic HTML elements
- **Focus Management**: Modals trap focus

## References

- [Frontend Architecture](./architecture.md)
- [State Management](./state_management.md)
