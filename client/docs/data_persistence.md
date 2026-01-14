# Data Persistence

## Overview

Eazy Split uses **IndexedDB** for client-side data persistence, enabling offline functionality and data retention across browser sessions.

## Why IndexedDB?

- **Capacity**: Stores GBs of data (vs 5-10MB for localStorage)
- **Structure**: Supports complex objects and queries
- **Performance**: Async API doesn't block UI
- **Persistence**: Data survives browser restarts
- **Transactions**: ACID guarantees for data integrity

## Database Schema

**Database Name**: `Eazy-split-db`  
**Version**: 1  
**Location**: [src/lib/db.ts](../src/lib/db.ts)

### Object Stores

IndexedDB uses "object stores" (similar to SQL tables). Eazy Split has three stores:

#### 1. `people` Store

**Key Path**: `id` (string, UUID)

**Schema**:
```typescript
{
  id: string;          // UUID v4
  name: string;        // Display name
  emoji?: string;      // Optional emoji avatar
  email?: string;      // Optional email
}
```

**Example**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Alice",
  "emoji": "👩",
  "email": "alice@example.com"
}
```

**Indexes**: None (small dataset, key-based lookup sufficient)

#### 2. `receipts` Store

**Key Path**: `id` (string, UUID)

**Schema**:
```typescript
{
  id: string;          // UUID v4
  platform: string;    // e.g., "Eazy", "Blinkit"
  date: string;        // YYYY-MM-DD format
  items: Item[];       // Array of items (embedded)
  tax?: number;        // Optional tax amount
  tip?: number;        // Optional tip/service charge
  currency: string;    // e.g., "INR"
}
```

**Item Schema** (embedded in `items` array):
```typescript
{
  id: string;              // UUID v4
  name: string;            // Item name
  price: number;           // Price in currency units
  originalPrice?: number;  // For validation
  sourceImageId?: string;  // Reference to uploaded image
}
```

**Example**:
```json
{
  "id": "receipt-123",
  "platform": "Eazy",
  "date": "2026-01-14",
  "items": [
    {
      "id": "item-1",
      "name": "Milk",
      "price": 48.00
    },
    {
      "id": "item-2",
      "name": "Eggs",
      "price": 120.00
    }
  ],
  "currency": "INR"
}
```

**Indexes**: None (could add index on `date` for date-range queries in future)

#### 3. `splits` Store

**Key Path**: `itemId` (string, references Item.id)

**Schema**:
```typescript
{
  itemId: string;      // References Item.id
  personIds: string[]; // Array of Person.id values
  isAll: boolean;      // If true, split among all people
}
```

**Example**:
```json
{
  "itemId": "item-1",
  "personIds": [],
  "isAll": true
}
```

```json
{
  "itemId": "item-2",
  "personIds": ["person-a", "person-b"],
  "isAll": false
}
```

**Indexes**: None (key-based lookup by itemId)

## Database Initialization

**Code**: [src/lib/db.ts](../src/lib/db.ts)

```typescript
import { openDB } from 'idb';

const DB_NAME = 'Eazy-split-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('people')) {
        db.createObjectStore('people', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('receipts')) {
        db.createObjectStore('receipts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('splits')) {
        db.createObjectStore('splits', { keyPath: 'itemId' });
      }
    },
  });
};

export const dbPromise = initDB();
```

### Upgrade Function

The `upgrade` callback runs when:
1. Database doesn't exist (first visit)
2. `DB_VERSION` is incremented (schema migration)

**Current behavior**: Creates all three stores if they don't exist.

## CRUD Operations

All operations use the `idb` library wrapper for cleaner async/await syntax.

### Create (Put)

```typescript
const db = await dbPromise;
await db.put('people', {
  id: uuidv4(),
  name: 'Alice'
});
```

**Note**: `put` is an upsert (insert or update). If `id` exists, it updates.

### Read (Get)

**Single record**:
```typescript
const db = await dbPromise;
const person = await db.get('people', 'person-id-123');
```

**All records**:
```typescript
const db = await dbPromise;
const allPeople = await db.getAll('people');
```

### Update (Put)

Same as create (upsert):
```typescript
const db = await dbPromise;
await db.put('people', {
  id: 'existing-id',
  name: 'Updated Name'
});
```

### Delete

```typescript
const db = await dbPromise;
await db.delete('people', 'person-id-123');
```

## Data Relationships

### Receipt → Items (1:N)

Items are **embedded** in the `ReceiptGroup.items` array (denormalized).

**Why denormalized?**
- Simpler queries (no joins)
- Items always belong to one receipt
- Fewer database operations

**Trade-off**: Updating an item requires updating the entire receipt group.

### Item → Split (1:1)

Each item has exactly one split assignment.

**Relationship**: `splits.itemId` → `items.id`

**Lookup**:
```typescript
const split = await db.get('splits', itemId);
```

### Split → People (N:M)

A split can reference multiple people via `personIds` array.

**Relationship**: `splits.personIds[]` → `people.id`

**Lookup**:
```typescript
const split = await db.get('splits', itemId);
const people = await db.getAll('people');
const assignedPeople = people.filter(p => 
  split.personIds.includes(p.id)
);
```

## Migration Strategy

### Version Bumping

To change schema, increment `DB_VERSION`:

```typescript
const DB_VERSION = 2; // Was 1
```

### Migration Example

**Scenario**: Add `createdAt` field to people.

```typescript
export const initDB = async () => {
  return openDB(DB_NAME, 2, { // Bump version
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create stores (if first time)
      if (!db.objectStoreNames.contains('people')) {
        db.createObjectStore('people', { keyPath: 'id' });
      }
      
      // Migration logic
      if (oldVersion < 2) {
        const peopleStore = transaction.objectStore('people');
        const allPeople = await peopleStore.getAll();
        
        for (const person of allPeople) {
          person.createdAt = new Date().toISOString();
          await peopleStore.put(person);
        }
      }
    },
  });
};
```

### Current Limitations

- No migrations implemented yet (v1 is initial schema)
- Changing schema requires manual data migration
- No automatic backfill of new fields

## Storage Limits

### Browser Quotas

- **Chrome**: ~60% of available disk space
- **Firefox**: ~50% of available disk space
- **Safari**: ~1GB (prompts user for more)

### Typical Usage

- **People**: ~100 bytes per person × 10 people = 1KB
- **Receipts**: ~500 bytes per receipt × 100 receipts = 50KB
- **Splits**: ~100 bytes per item × 1000 items = 100KB

**Total**: ~150KB for typical usage (well within limits)

### Checking Quota

```typescript
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log(`Used: ${estimate.usage} / ${estimate.quota}`);
}
```

## Performance Characteristics

### Read Performance

- **Single get**: <5ms
- **getAll (100 records)**: <20ms
- **getAll (1000 records)**: <100ms

### Write Performance

- **Single put**: <10ms
- **Batch put (100 records)**: <200ms

### Optimization Tips

1. **Batch operations**: Use transactions for multiple writes
2. **Avoid getAll in loops**: Cache results
3. **Use indexes**: For complex queries (not needed yet)

## Error Handling

### Common Errors

**QuotaExceededError**:
```typescript
try {
  await db.put('receipts', largeReceipt);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    alert('Storage full! Please delete old receipts.');
  }
}
```

**NotFoundError**:
```typescript
const person = await db.get('people', 'invalid-id');
// Returns undefined (not an error)
```

**VersionError**:
- Occurs if another tab has a newer DB version open
- Solution: Reload page or close other tabs

## Data Export/Import

### Export to JSON

```typescript
async function exportData() {
  const db = await dbPromise;
  const data = {
    people: await db.getAll('people'),
    receipts: await db.getAll('receipts'),
    splits: await db.getAll('splits')
  };
  
  const json = JSON.stringify(data, null, 2);
  // Download or copy to clipboard
}
```

### Import from JSON

```typescript
async function importData(json: string) {
  const data = JSON.parse(json);
  const db = await dbPromise;
  
  for (const person of data.people) {
    await db.put('people', person);
  }
  for (const receipt of data.receipts) {
    await db.put('receipts', receipt);
  }
  for (const split of data.splits) {
    await db.put('splits', split);
  }
}
```

## Privacy & Security

### Local-Only Storage

- All data stays in browser (never sent to server by default)
- No cloud sync (unless explicitly implemented)
- Data tied to origin (domain + protocol)

### Clearing Data

**User action**:
- Browser settings → Clear browsing data → IndexedDB

**Programmatic**:
```typescript
async function clearAllData() {
  const db = await dbPromise;
  await db.clear('people');
  await db.clear('receipts');
  await db.clear('splits');
}
```

### Incognito Mode

- IndexedDB works in incognito/private mode
- Data deleted when incognito session ends

## Debugging

### Chrome DevTools

1. Open DevTools (F12)
2. Application tab → IndexedDB → Eazy-split-db
3. Expand stores to view data
4. Right-click to delete records

### Logging

Add logging to database operations:

```typescript
export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      console.log('Upgrading database to version', DB_VERSION);
      // ... create stores
    },
  });
  console.log('Database initialized');
  return db;
};
```

## Future Enhancements

### Potential Improvements

1. **Indexes**: Add index on `receipts.date` for date-range queries
2. **Transactions**: Batch writes for better performance
3. **Compression**: Compress large receipts before storing
4. **Sync**: Optional cloud backup via backend API
5. **Search**: Full-text search on item names

### Cloud Sync Design

If implementing sync:

```typescript
interface SyncMetadata {
  lastSyncedAt: string;
  version: number;
  deviceId: string;
}

// Add to each record
interface Person {
  id: string;
  name: string;
  syncMeta?: SyncMetadata;
}
```

## References

- [State Management](./state_management.md) - How stores use IndexedDB
- [idb Library Documentation](https://github.com/jakearchibald/idb)
- [IndexedDB API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
