# Export System

## Overview

The export system generates formatted text output of receipt splits for sharing via messaging apps, email, or documents.

**Location**: [src/lib/export.ts](../src/lib/export.ts)

## Supported Formats

1. **Plain Text**: WhatsApp/SMS friendly with emojis and simple formatting
2. **Markdown**: Rich formatting for documents, notes, or GitHub

## Function Signature

```typescript
function generateExportText(
  groups: ReceiptGroup[],
  splits: Record<string, SplitAssignment>,
  people: Person[],
  format: 'text' | 'markdown'
): string
```

**Parameters**:
- `groups`: All receipt groups to export
- `splits`: Split assignments for all items
- `people`: List of people
- `format`: Output format ('text' or 'markdown')

**Returns**: Formatted string ready for clipboard or file download

## Plain Text Format

### Example Output

```
🧾 Eazy
📅 2026-01-14

--- BREAKDOWN ---
▫️ Milk: ₹48.00 (Everyone)
▫️ Eggs: ₹120.00 (Alice, Bob)
▫️ Bread: ₹40.00 (Alice)

--- FINAL SPLITS ---
👤 Alice      : ₹124.00
👤 Bob        : ₹84.00

💰 Total: ₹208.00
```

### Format Specification

**Header**:
- 🧾 emoji + platform name (uppercase)
- 📅 emoji + date (YYYY-MM-DD)

**Breakdown Section**:
- `--- BREAKDOWN ---` separator
- Each item: `▫️ {name}: ₹{price} ({assigned})`
- Assigned: "Everyone", "Unassigned", or comma-separated names

**Final Splits Section**:
- `--- FINAL SPLITS ---` separator
- Each person: `👤 {name (padded)}: ₹{total}`
- Only shows people with non-zero totals

**Footer**:
- 💰 emoji + grand total

### Design Rationale

**Why emojis?** 
- Visual appeal in messaging apps
- Quick recognition of sections
- Universal (no language barrier)

**Why simple formatting?**
- Works in any text field (WhatsApp, SMS, Slack)
- No special characters that break on copy-paste
- Readable on any device

**Why padding?**
- Aligns amounts for easier reading
- Uses `String.padEnd(10)` for names

## Markdown Format

### Example Output

```markdown
# Eazy
📅 *2026-01-14*

## Breakdown
- **Milk**: ₹48.00 _(Everyone)_
- **Eggs**: ₹120.00 _(Alice, Bob)_
- **Bread**: ₹40.00 _(Alice)_

## Final Splits
- **Alice**: ₹124.00
- **Bob**: ₹84.00

💰 Total: ₹208.00
```

### Format Specification

**Header**:
- `# {platform}` (H1)
- `📅 *{date}*` (italic)

**Breakdown Section**:
- `## Breakdown` (H2)
- Each item: `- **{name}**: ₹{price} _({assigned})_`

**Final Splits Section**:
- `## Final Splits` (H2)
- Each person: `- **{name}**: ₹{total}`

**Footer**:
- `💰 Total: ₹{grandTotal}`

### Use Cases

- Save as `.md` file for documentation
- Paste into Notion, Obsidian, or other note-taking apps
- Commit to Git for expense tracking
- Export to PDF via Markdown renderer

## Implementation Details

### Header Generation

```typescript
const date = groups[0]?.date || new Date().toISOString().split('T')[0];
const distinctPlatforms = Array.from(new Set(groups.map(g => g.platform)));
const title = distinctPlatforms.join(' + ') || 'Receipt Split';

if (isMd) {
  output += `# ${title}\n📅 *${date}*\n\n`;
} else {
  output += `🧾 ${title.toUpperCase()}\n📅 ${date}\n\n`;
}
```

**Multi-platform handling**: If multiple platforms (e.g., Eazy + Blinkit), joins with " + ".

### Item Breakdown

```typescript
group.items.forEach(item => {
  const split = splits[item.id];
  let assignedNames = 'Unassigned';
  
  if (split) {
    if (split.isAll) {
      assignedNames = 'Everyone';
    } else if (split.personIds.length > 0) {
      const names = split.personIds.map(id => 
        people.find(p => p.id === id)?.name || 'Unknown'
      );
      assignedNames = names.join(', ');
    }
  }
  
  const price = item.price.toFixed(2);
  
  if (isMd) {
    output += `- **${item.name}**: ₹${price} _(${assignedNames})_\n`;
  } else {
    output += `▫️ ${item.name}: ₹${price} (${assignedNames})\n`;
  }
});
```

**Assignment labels**:
- `isAll: true` → "Everyone"
- `personIds: []` → "Unassigned"
- `personIds: [...]` → "Alice, Bob, Charlie"

### Final Splits

```typescript
people.forEach(person => {
  const total = result.personTotals[person.id] || 0;
  if (total > 0) {
    if (isMd) {
      output += `- **${person.name}**: ₹${total.toFixed(2)}\n`;
    } else {
      output += `👤 ${person.name.padEnd(10)} : ₹${total.toFixed(2)}\n`;
    }
  }
});
```

**Only non-zero totals**: People who owe nothing are omitted for clarity.

### Grand Total

```typescript
const grandTotal = allItems.reduce((sum, i) => sum + i.price, 0);
output += `\n💰 Total: ₹${grandTotal.toFixed(2)}`;
```

## Usage in Components

### SplitPreview Component

```typescript
function SplitPreview() {
  const groups = useReceiptStore(state => state.groups);
  const splits = useReceiptStore(state => state.splits);
  const people = usePeopleStore(state => state.people);
  
  const handleCopyText = () => {
    const text = generateExportText(groups, splits, people, 'text');
    navigator.clipboard.writeText(text);
    // Show success toast
  };
  
  const handleExportMarkdown = () => {
    const md = generateExportText(groups, splits, people, 'markdown');
    navigator.clipboard.writeText(md);
    // Or download as file
  };
  
  return (
    <div>
      <button onClick={handleCopyText}>Copy as Text</button>
      <button onClick={handleExportMarkdown}>Export Markdown</button>
    </div>
  );
}
```

### Clipboard API

```typescript
navigator.clipboard.writeText(text).then(() => {
  console.log('Copied to clipboard');
}).catch(err => {
  console.error('Failed to copy:', err);
  // Fallback: show text in modal for manual copy
});
```

**Browser support**: Chrome 63+, Firefox 53+, Safari 13.1+

## Edge Cases

### 1. No Receipts

**Input**: Empty `groups` array

**Output**:
```
🧾 RECEIPT SPLIT
📅 2026-01-14

--- BREAKDOWN ---

--- FINAL SPLITS ---

💰 Total: ₹0.00
```

### 2. Multiple Platforms

**Input**: Groups with platforms ["Eazy", "Blinkit", "DMart"]

**Output**:
```
🧾 Eazy + BLINKIT + DMART
📅 2026-01-14
...
```

### 3. Unknown Person (Deleted)

**Input**: Split references person ID that doesn't exist in `people` array

**Output**: Shows "Unknown" in assignment list

```typescript
const names = split.personIds.map(id => 
  people.find(p => p.id === id)?.name || 'Unknown'
);
```

### 4. Very Long Names

**Input**: Person name > 10 characters

**Plain Text**: Name gets padded, may wrap on narrow screens

**Markdown**: No padding, renders naturally

### 5. Special Characters

**Input**: Item name with markdown characters (e.g., "Milk (2L)")

**Markdown**: Parentheses are safe, but `*`, `_`, `#` could break formatting

**Solution** (future): Escape special characters:
```typescript
const escapedName = item.name.replace(/([*_#])/g, '\\$1');
```

## Customization

### Currency Symbol

Currently hardcoded to `₹` (Indian Rupee). To make dynamic:

```typescript
const currencySymbol = groups[0]?.currency === 'USD' ? '$' : '₹';
output += `${currencySymbol}${price}`;
```

### Date Format

Currently uses ISO format (YYYY-MM-DD). To localize:

```typescript
const dateObj = new Date(date);
const formattedDate = dateObj.toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});
// Output: "Jan 14, 2026"
```

### Emoji Customization

Allow users to choose emoji style:

```typescript
const emojis = {
  receipt: '🧾',
  date: '📅',
  person: '👤',
  total: '💰',
  item: '▫️'
};
```

## File Download

To download as file instead of clipboard:

```typescript
function downloadMarkdown() {
  const md = generateExportText(groups, splits, people, 'markdown');
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-split-${new Date().toISOString().split('T')[0]}.md`;
  a.click();
  
  URL.revokeObjectURL(url);
}
```

## Testing

### Unit Test Example

```typescript
import { generateExportText } from './export';

test('generates plain text format', () => {
  const groups = [{
    id: '1',
    platform: 'Eazy',
    date: '2026-01-14',
    items: [{ id: 'i1', name: 'Milk', price: 48 }],
    currency: 'INR'
  }];
  
  const splits = {
    'i1': { itemId: 'i1', personIds: [], isAll: true }
  };
  
  const people = [
    { id: 'a', name: 'Alice' },
    { id: 'b', name: 'Bob' }
  ];
  
  const text = generateExportText(groups, splits, people, 'text');
  
  expect(text).toContain('🧾 Eazy');
  expect(text).toContain('📅 2026-01-14');
  expect(text).toContain('▫️ Milk: ₹48.00 (Everyone)');
  expect(text).toContain('👤 Alice');
  expect(text).toContain('👤 Bob');
  expect(text).toContain('💰 Total: ₹48.00');
});
```

## Performance

### Time Complexity

- **O(I + P)** where I = items, P = people
- Linear scan through items and people

### Optimization

For 1000+ items, consider:
- Streaming output (yield chunks)
- Web Worker for generation
- Memoization if inputs unchanged

Currently not needed (<1ms for typical receipts).

## Future Enhancements

### 1. PDF Export

Use library like `jsPDF`:

```typescript
import jsPDF from 'jspdf';

function exportPDF() {
  const doc = new jsPDF();
  doc.text(generateExportText(groups, splits, people, 'text'), 10, 10);
  doc.save('receipt-split.pdf');
}
```

### 2. CSV Export

For spreadsheet import:

```csv
Item,Price,Assigned To
Milk,48.00,"Alice, Bob"
Eggs,120.00,"Alice, Bob"
```

### 3. Image Export

Generate image with styled text (shareable on social media):

```typescript
import html2canvas from 'html2canvas';

function exportImage() {
  const element = document.getElementById('split-preview');
  html2canvas(element).then(canvas => {
    canvas.toBlob(blob => {
      // Download or share
    });
  });
}
```

### 4. Email Template

Generate HTML email:

```html
<h1>Receipt Split - Eazy</h1>
<table>
  <tr><td>Milk</td><td>₹48.00</td><td>Everyone</td></tr>
  ...
</table>
```

### 5. Localization

Support multiple languages:

```typescript
const i18n = {
  en: { breakdown: 'Breakdown', total: 'Total' },
  hi: { breakdown: 'विवरण', total: 'कुल' }
};
```

## References

- [Split Calculation](./split_calculation.md) - How totals are calculated
- [Technical Plan](../../pwa_receipt_splitter_technical_plan_api_spec.md#L174-197) - Original export spec
