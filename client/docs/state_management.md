# State Management

## Overview

Eazy Split uses **Zustand** for state management, providing a lightweight, TypeScript-friendly alternative to Redux with minimal boilerplate.

## Why Zustand?

- **Simplicity**: No providers, actions, or reducers required
- **TypeScript**: Excellent type inference out of the box
- **Performance**: Selective subscriptions prevent unnecessary re-renders
- **Size**: ~1KB gzipped
- **DevTools**: Works with React DevTools

## Store Architecture

The app has two primary stores:

1. **usePeopleStore** - Manages people/participants
2. **useReceiptStore** - Manages receipts and split assignments

Both stores follow the same pattern:
- State stored in Zustand
- Persistence handled via IndexedDB
- Async actions for data operations

## usePeopleStore

**Location**: [src/store/usePeopleStore.ts](../src/store/usePeopleStore.ts)

### State Shape

```typescript
interface PeopleState {
  people: Person[];
  loading: boolean;
  loadPeople: () => Promise<void>;
  addPerson: (person: Person) => Promise<void>;
  updatePerson: (person: Person) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
}
```

### Actions

#### loadPeople()
**Purpose**: Load all people from IndexedDB on app initialization.

**Flow**:
1. Query IndexedDB `people` store
2. Update Zustand state with results
3. Set `loading: false`

**Usage**:
```typescript
const { loadPeople } = usePeopleStore();

useEffect(() => {
  loadPeople();
}, []);
```

#### addPerson(person)
**Purpose**: Add a new person to the list.

**Flow**:
1. Write to IndexedDB `people` store
2. Append to Zustand `people` array
3. UI re-renders automatically

**Example**:
```typescript
const { addPerson } = usePeopleStore();

const newPerson = {
  id: uuidv4(),
  name: 'Alice',
  emoji: '👩',
  email: 'alice@example.com'
};

await addPerson(newPerson);
```

#### updatePerson(person)
**Purpose**: Update an existing person's details.

**Flow**:
1. Update in IndexedDB
2. Replace in Zustand array (by id)

#### deletePerson(id)
**Purpose**: Remove a person from the list.

**Flow**:
1. Delete from IndexedDB
2. Filter out from Zustand array

> [!WARNING]
> Deleting a person does NOT remove their split assignments. This may cause orphaned references. Future enhancement: cascade delete or prevent deletion if person has assignments.

## useReceiptStore

**Location**: [src/store/useReceiptStore.ts](../src/store/useReceiptStore.ts)

### State Shape

```typescript
interface ReceiptState {
  groups: ReceiptGroup[];
  splits: Record<string, SplitAssignment>; // Keyed by itemId
  loading: boolean;
  loadReceipts: () => Promise<void>;
  addGroup: (group: ReceiptGroup) => Promise<void>;
  updateGroup: (group: ReceiptGroup) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  updateSplit: (itemId: string, personIds: string[], isAll: boolean) => Promise<void>;
}
```

### Key Design: Splits as Record

Splits are stored as a **Record (object)** keyed by `itemId` for O(1) lookup:

```typescript
splits: {
  'item-123': { itemId: 'item-123', personIds: ['p1', 'p2'], isAll: false },
  'item-456': { itemId: 'item-456', personIds: [], isAll: true }
}
```

This is more efficient than an array when checking/updating individual item assignments.

### Actions

#### loadReceipts()
**Purpose**: Load all receipts and splits from IndexedDB on app initialization.

**Flow**:
1. Query IndexedDB `receipts` store → `groups`
2. Query IndexedDB `splits` store → array
3. Convert splits array to Record (keyed by itemId)
4. Update Zustand state
5. Set `loading: false`

**Code** ([src/store/useReceiptStore.ts#L21-34](../src/store/useReceiptStore.ts#L21-L34)):
```typescript
loadReceipts: async () => {
  try {
    const db = await dbPromise;
    const groups = await db.getAll('receipts');
    const splitsList = await db.getAll('splits');
    const splits = splitsList.reduce((acc, split) => {
      acc[split.itemId] = split;
      return acc;
    }, {} as Record<string, SplitAssignment>);

    set({ groups, splits, loading: false });
  } catch (error) {
    console.error("Failed to load receipts", error);
  }
}
```

#### addGroup(group)
**Purpose**: Add a new receipt group (from OCR or manual entry).

**Flow**:
1. Write group to IndexedDB `receipts` store
2. Append to Zustand `groups` array
3. **Initialize splits** for all items (default: `isAll: true`)
4. Write splits to IndexedDB `splits` store
5. Update Zustand `splits` record

**Code** ([src/store/useReceiptStore.ts#L36-48](../src/store/useReceiptStore.ts#L36-L48)):
```typescript
addGroup: async (group) => {
  const db = await dbPromise;
  await db.put('receipts', group);
  set(state => ({ groups: [...state.groups, group] }));

  // Initialize splits for all items to 'All'
  const newSplits: Record<string, SplitAssignment> = {};
  for (const item of group.items) {
    const split = { itemId: item.id, personIds: [], isAll: true };
    await db.put('splits', split);
    newSplits[item.id] = split;
  }
  set(state => ({ splits: { ...state.splits, ...newSplits } }));
}
```

**Why default to "All"?**
Most items are shared by everyone. User can uncheck "All" and select specific people if needed.

#### updateGroup(group)
**Purpose**: Update an existing receipt group (e.g., edit items, add/remove items).

**Flow**:
1. Update in IndexedDB
2. Replace in Zustand array (by id)

**Use Case**: User edits item name/price via ItemEditModal.

#### deleteGroup(id)
**Purpose**: Remove an entire receipt group.

**Flow**:
1. Delete from IndexedDB `receipts` store
2. Filter out from Zustand `groups` array

> [!NOTE]
> This does NOT delete associated splits. Orphaned splits remain in IndexedDB. Future enhancement: cascade delete.

#### updateSplit(itemId, personIds, isAll)
**Purpose**: Update split assignment for a specific item.

**Flow**:
1. Create `SplitAssignment` object
2. Write to IndexedDB `splits` store (upsert by itemId)
3. Update Zustand `splits` record

**Code** ([src/store/useReceiptStore.ts#L62-68](../src/store/useReceiptStore.ts#L62-L68)):
```typescript
updateSplit: async (itemId, personIds, isAll) => {
  const split: SplitAssignment = { itemId, personIds, isAll };
  const db = await dbPromise;
  await db.put('splits', split);
  set(state => ({
    splits: { ...state.splits, [itemId]: split }
  }));
}
```

**Triggered by**: User toggling checkboxes in ReceiptGrid.

## State Update Patterns

### Immutable Updates

Zustand requires immutable updates (like Redux). Always create new objects/arrays:

**✅ Correct**:
```typescript
set(state => ({ groups: [...state.groups, newGroup] }))
```

**❌ Incorrect**:
```typescript
set(state => {
  state.groups.push(newGroup); // Mutates state!
  return state;
})
```

### Functional Updates

Use functional form when new state depends on old state:

```typescript
set(state => ({
  groups: state.groups.map(g => g.id === id ? updatedGroup : g)
}))
```

### Async Actions

All database operations are async. Actions use `async/await`:

```typescript
addPerson: async (person) => {
  const db = await dbPromise;
  await db.put('people', person);
  set(state => ({ people: [...state.people, person] }));
}
```

## Component Integration

### Reading State

Use Zustand hooks in components:

```typescript
function PeopleList() {
  const people = usePeopleStore(state => state.people);
  const loading = usePeopleStore(state => state.loading);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <ul>
      {people.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

### Selective Subscriptions

Only subscribe to what you need to prevent unnecessary re-renders:

**✅ Efficient**:
```typescript
const people = usePeopleStore(state => state.people);
```

**❌ Inefficient**:
```typescript
const store = usePeopleStore(); // Re-renders on ANY state change
```

### Calling Actions

```typescript
function AddPersonButton() {
  const addPerson = usePeopleStore(state => state.addPerson);
  
  const handleClick = async () => {
    await addPerson({
      id: uuidv4(),
      name: 'New Person'
    });
  };
  
  return <button onClick={handleClick}>Add Person</button>;
}
```

## Persistence Strategy

### Write-Through Cache

Every state mutation immediately writes to IndexedDB:

```
User Action → Zustand Update → IndexedDB Write
```

This ensures data is never lost, even if the page crashes.

### Load on Mount

App loads all data from IndexedDB on initialization:

```typescript
// In App.tsx or main component
useEffect(() => {
  usePeopleStore.getState().loadPeople();
  useReceiptStore.getState().loadReceipts();
}, []);
```

### No Debouncing

Currently, every update writes immediately. For high-frequency updates (e.g., typing in search), consider debouncing:

```typescript
const debouncedUpdate = debounce(updatePerson, 500);
```

## Error Handling

### Current Strategy

Errors are logged to console:

```typescript
try {
  await db.put('people', person);
} catch (error) {
  console.error("Failed to add person", error);
}
```

### Future Enhancement

Add user-facing error messages:

```typescript
interface PeopleState {
  error: string | null;
  // ...
}

// In action:
catch (error) {
  set({ error: 'Failed to add person. Please try again.' });
}
```

## DevTools Integration

Zustand works with React DevTools. To enable:

```typescript
import { devtools } from 'zustand/middleware';

export const usePeopleStore = create(
  devtools((set) => ({
    // ... state
  }), { name: 'PeopleStore' })
);
```

## Performance Considerations

### Store Size

- **People**: Typically <100 people, negligible
- **Receipts**: 100s of groups, 1000s of items possible
- **Splits**: One per item, same as items count

### Optimization Strategies

1. **Selective Subscriptions**: Only subscribe to needed state slices
2. **Memoization**: Use `React.memo` for expensive components
3. **Virtualization**: If 1000+ items, use react-window for grid

### IndexedDB Performance

- Writes are async but fast (<10ms typically)
- Reads on load are batched (one query per store)
- No indexes needed (small dataset)

## Testing Stores

### Unit Testing

Mock IndexedDB for tests:

```typescript
import { usePeopleStore } from './usePeopleStore';

// Mock dbPromise
jest.mock('@/lib/db', () => ({
  dbPromise: Promise.resolve({
    put: jest.fn(),
    getAll: jest.fn(() => [])
  })
}));

test('addPerson adds to state', async () => {
  const { addPerson, people } = usePeopleStore.getState();
  await addPerson({ id: '1', name: 'Test' });
  expect(people).toHaveLength(1);
});
```

## References

- [Data Persistence](./data_persistence.md) - IndexedDB schema
- [Frontend Architecture](./architecture.md) - Component integration
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
