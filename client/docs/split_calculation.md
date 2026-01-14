# Split Calculation Algorithm

## Overview

The split calculation algorithm fairly divides receipt item costs among multiple people, handling edge cases like rounding and unassigned items.

**Location**: [src/lib/splitter.ts](../src/lib/splitter.ts)

## Purpose

Given a list of items and their assignments, calculate:
1. How much each person owes
2. Total of unassigned items
3. Grand total of all items

## Algorithm Design

### Key Principles

1. **Cent-Based Math**: All calculations use integer cents to avoid floating-point errors
2. **Fair Remainder Distribution**: Extra cents distributed to first N people deterministically
3. **Explicit Assignments**: Items can be assigned to specific people or "All"
4. **Unassigned Tracking**: Items with no assignment are flagged

### Data Structures

**Input**:
```typescript
function calculateSplits(
  items: Item[],
  splits: Record<string, SplitAssignment>,
  people: Person[]
): SplitResult
```

**Output**:
```typescript
interface SplitResult {
  personTotals: Record<string, number>;  // personId → amount (in currency units)
  unassignedTotal: number;               // Total of unassigned items
  grandTotal: number;                    // Sum of all items
}
```

## Algorithm Steps

### Step 1: Initialize Totals

```typescript
const personTotals: Record<string, number> = {};
let unassignedTotalCents = 0;
let grandTotalCents = 0;
```

All amounts tracked in **cents** (integer math).

### Step 2: Process Each Item

For each item in the receipt:

```typescript
items.forEach(item => {
  const priceCents = Math.round(item.price * 100);
  grandTotalCents += priceCents;
  
  const split = splits[item.id];
  
  // ... (see below)
});
```

**Why round?** Converts currency units (e.g., 48.50) to cents (4850) for integer math.

### Step 3: Determine Assignment

**Case 1: No split record or empty assignment**
```typescript
if (!split || (!split.isAll && split.personIds.length === 0)) {
  unassignedTotalCents += priceCents;
  return; // Skip to next item
}
```

**Case 2: "All" is checked**
```typescript
const assignedIds = split.isAll 
  ? people.map(p => p.id) 
  : split.personIds;
```

If `isAll: true`, assign to everyone. Otherwise, use specific `personIds`.

**Case 3: Empty people list**
```typescript
if (assignedIds.length === 0) {
  unassignedTotalCents += priceCents;
  return;
}
```

Edge case: "All" is checked but no people exist.

### Step 4: Split Price Among Assigned People

```typescript
const count = assignedIds.length;
const splitCents = Math.floor(priceCents / count);
const remainder = priceCents - (splitCents * count);
```

**Example**: 100 cents ÷ 3 people
- `splitCents` = 33 (floor division)
- `remainder` = 100 - (33 × 3) = 1 cent

### Step 5: Distribute Remainder

```typescript
assignedIds.forEach((pid, index) => {
  const share = splitCents + (index < remainder ? 1 : 0);
  personTotals[pid] = (personTotals[pid] || 0) + share;
});
```

**Remainder distribution**: First N people get 1 extra cent.

**Example** (continued):
- Person 0: 33 + 1 = 34 cents
- Person 1: 33 + 0 = 33 cents
- Person 2: 33 + 0 = 33 cents
- **Total**: 34 + 33 + 33 = 100 ✓

**Why deterministic?** Array order is stable (same people always get remainder).

### Step 6: Convert Back to Currency Units

```typescript
const finalTotals: Record<string, number> = {};
people.forEach(p => finalTotals[p.id] = 0); // Init all to 0

for (const pid in personTotals) {
  finalTotals[pid] = personTotals[pid] / 100;
}

return {
  personTotals: finalTotals,
  unassignedTotal: unassignedTotalCents / 100,
  grandTotal: grandTotalCents / 100
};
```

**Why init all to 0?** Ensures every person appears in result, even if they owe nothing.

## Complete Code

**Source**: [src/lib/splitter.ts#L9-62](../src/lib/splitter.ts#L9-L62)

```typescript
export function calculateSplits(
  items: Item[],
  splits: Record<string, SplitAssignment>,
  people: Person[]
): SplitResult {
  const personTotals: Record<string, number> = {};
  let unassignedTotalCents = 0;
  let grandTotalCents = 0;

  items.forEach(item => {
    const priceCents = Math.round(item.price * 100);
    grandTotalCents += priceCents;

    const split = splits[item.id];

    if (!split || (!split.isAll && split.personIds.length === 0)) {
      unassignedTotalCents += priceCents;
      return;
    }

    const assignedIds = split.isAll ? people.map(p => p.id) : split.personIds;

    if (assignedIds.length === 0) {
      unassignedTotalCents += priceCents;
      return;
    }

    const count = assignedIds.length;
    const splitCents = Math.floor(priceCents / count);
    const remainder = priceCents - (splitCents * count);

    assignedIds.forEach((pid, index) => {
      const share = splitCents + (index < remainder ? 1 : 0);
      personTotals[pid] = (personTotals[pid] || 0) + share;
    });
  });

  const finalTotals: Record<string, number> = {};
  people.forEach(p => finalTotals[p.id] = 0);

  for (const pid in personTotals) {
    finalTotals[pid] = personTotals[pid] / 100;
  }

  return {
    personTotals: finalTotals,
    unassignedTotal: unassignedTotalCents / 100,
    grandTotal: grandTotalCents / 100
  };
}
```

## Examples

### Example 1: Simple Split (All)

**Input**:
- Items: `[{ id: '1', name: 'Milk', price: 48 }]`
- People: `[{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]`
- Splits: `{ '1': { itemId: '1', personIds: [], isAll: true } }`

**Calculation**:
- 48.00 → 4800 cents
- Assigned to: Alice, Bob (2 people)
- Split: 4800 ÷ 2 = 2400 cents each
- Remainder: 0

**Output**:
```json
{
  "personTotals": {
    "a": 24.00,
    "b": 24.00
  },
  "unassignedTotal": 0,
  "grandTotal": 48.00
}
```

### Example 2: Uneven Split

**Input**:
- Items: `[{ id: '1', name: 'Eggs', price: 100 }]`
- People: `[{ id: 'a' }, { id: 'b' }, { id: 'c' }]`
- Splits: `{ '1': { itemId: '1', personIds: [], isAll: true } }`

**Calculation**:
- 100.00 → 10000 cents
- Assigned to: a, b, c (3 people)
- Split: 10000 ÷ 3 = 3333 cents (floor)
- Remainder: 10000 - (3333 × 3) = 1 cent

**Distribution**:
- Person 0 (a): 3333 + 1 = 3334 cents
- Person 1 (b): 3333 cents
- Person 2 (c): 3333 cents

**Output**:
```json
{
  "personTotals": {
    "a": 33.34,
    "b": 33.33,
    "c": 33.33
  },
  "unassignedTotal": 0,
  "grandTotal": 100.00
}
```

### Example 3: Specific Assignment

**Input**:
- Items: `[{ id: '1', name: 'Beer', price: 200 }]`
- People: `[{ id: 'a' }, { id: 'b' }, { id: 'c' }]`
- Splits: `{ '1': { itemId: '1', personIds: ['a', 'b'], isAll: false } }`

**Calculation**:
- 200.00 → 20000 cents
- Assigned to: a, b only (2 people)
- Split: 20000 ÷ 2 = 10000 cents each

**Output**:
```json
{
  "personTotals": {
    "a": 100.00,
    "b": 100.00,
    "c": 0.00
  },
  "unassignedTotal": 0,
  "grandTotal": 200.00
}
```

### Example 4: Unassigned Item

**Input**:
- Items: `[{ id: '1', name: 'Mystery', price: 50 }]`
- People: `[{ id: 'a' }, { id: 'b' }]`
- Splits: `{ '1': { itemId: '1', personIds: [], isAll: false } }`

**Calculation**:
- No assignment (isAll: false, personIds: [])
- Add to unassigned total

**Output**:
```json
{
  "personTotals": {
    "a": 0.00,
    "b": 0.00
  },
  "unassignedTotal": 50.00,
  "grandTotal": 50.00
}
```

## Edge Cases

### 1. Floating-Point Precision

**Problem**: `0.1 + 0.2 = 0.30000000000000004` in JavaScript

**Solution**: Use integer cents throughout calculation

```typescript
// ❌ Wrong
const share = item.price / count;

// ✅ Correct
const priceCents = Math.round(item.price * 100);
const shareCents = Math.floor(priceCents / count);
const share = shareCents / 100;
```

### 2. Rounding Errors

**Problem**: ₹100 ÷ 3 = ₹33.33... (infinite decimal)

**Solution**: Distribute remainder as whole cents

```typescript
const remainder = priceCents - (splitCents * count);
// Give first `remainder` people 1 extra cent
```

**Verification**: Sum of shares always equals original price (no money lost/created)

### 3. Empty People List

**Problem**: "All" is checked but no people exist

**Solution**: Treat as unassigned

```typescript
if (assignedIds.length === 0) {
  unassignedTotalCents += priceCents;
  return;
}
```

### 4. Deleted People

**Problem**: Split references a person who was deleted

**Solution**: Filter out invalid IDs (future enhancement)

```typescript
const validIds = split.personIds.filter(id => 
  people.some(p => p.id === id)
);
```

Currently not implemented (orphaned references possible).

### 5. Very Large Prices

**Problem**: Price > Number.MAX_SAFE_INTEGER / 100

**Solution**: Use BigInt for extreme cases (not currently needed)

**Practical limit**: ₹90,071,992,547,409.91 (unlikely for grocery receipts!)

## Performance

### Time Complexity

- **O(I × P)** where I = items, P = people
- Worst case: Every item assigned to all people
- Typical: O(I) since P is small (<10)

### Space Complexity

- **O(P)** for personTotals map
- Constant otherwise

### Optimization

For 1000+ items, consider:
- Memoization (cache results if inputs unchanged)
- Web Workers (offload calculation from main thread)

Currently not needed (calculations are <1ms for typical receipts).

## Testing

### Unit Test Example

```typescript
import { calculateSplits } from './splitter';

test('splits evenly among all people', () => {
  const items = [{ id: '1', name: 'Test', price: 100 }];
  const people = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
  const splits = { '1': { itemId: '1', personIds: [], isAll: true } };
  
  const result = calculateSplits(items, splits, people);
  
  expect(result.personTotals.a).toBe(50);
  expect(result.personTotals.b).toBe(50);
  expect(result.grandTotal).toBe(100);
});

test('handles remainder correctly', () => {
  const items = [{ id: '1', name: 'Test', price: 100 }];
  const people = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' }
  ];
  const splits = { '1': { itemId: '1', personIds: [], isAll: true } };
  
  const result = calculateSplits(items, splits, people);
  
  // First person gets extra cent
  expect(result.personTotals.a).toBe(33.34);
  expect(result.personTotals.b).toBe(33.33);
  expect(result.personTotals.c).toBe(33.33);
  
  // Verify sum
  const sum = result.personTotals.a + result.personTotals.b + result.personTotals.c;
  expect(sum).toBe(100);
});
```

## Usage in Components

### SplitPreview Component

```typescript
function SplitPreview() {
  const groups = useReceiptStore(state => state.groups);
  const splits = useReceiptStore(state => state.splits);
  const people = usePeopleStore(state => state.people);
  
  const allItems = groups.flatMap(g => g.items);
  const result = calculateSplits(allItems, splits, people);
  
  return (
    <div>
      {people.map(person => (
        <div key={person.id}>
          {person.name}: ₹{result.personTotals[person.id].toFixed(2)}
        </div>
      ))}
      <div>Total: ₹{result.grandTotal.toFixed(2)}</div>
    </div>
  );
}
```

## Future Enhancements

### 1. Custom Split Ratios

Allow unequal splits (e.g., 60/40):

```typescript
interface SplitAssignment {
  itemId: string;
  assignments: { personId: string; ratio: number }[];
}
```

### 2. Tax/Tip Distribution

Distribute tax/tip proportionally:

```typescript
function distributeTax(personTotals, taxAmount, grandTotal) {
  for (const pid in personTotals) {
    const share = (personTotals[pid] / grandTotal) * taxAmount;
    personTotals[pid] += share;
  }
}
```

### 3. Currency Conversion

Support multiple currencies:

```typescript
function calculateSplits(items, splits, people, exchangeRates) {
  // Convert all to base currency first
}
```

## References

- [State Management](./state_management.md) - How splits are stored
- [Export System](./export_system.md) - How results are formatted
- [Technical Plan](../../pwa_receipt_splitter_technical_plan_api_spec.md#L156-168) - Original algorithm spec
