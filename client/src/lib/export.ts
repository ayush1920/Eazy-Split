import type { ReceiptGroup, Person, SplitAssignment } from '@/types';
import { calculateSplits } from './splitter';

export function generateExportText(
    groups: ReceiptGroup[],
    splits: Record<string, SplitAssignment>,
    people: Person[],
    format: 'text' | 'markdown'
): string {
    const allItems = groups.flatMap(g => g.items);
    const result = calculateSplits(allItems, splits, people);
    const isMd = format === 'markdown';

    let output = '';

    // Header
    // Combined title if multiple
    const distinctPlatforms = Array.from(new Set(groups.map(g => g.platform)));
    const title = distinctPlatforms.join(' + ') || 'Receipt Split';

    if (isMd) {
        output += `# ${title}\n\n`;
    } else {
        output += `🧾 ${title.toUpperCase()}\n\n`;
    }

    // Items Section
    output += isMd ? `## Breakdown\n` : `--- BREAKDOWN ---\n`;

    groups.forEach(group => {
        if (groups.length > 0) {
            output += `\n${isMd ? `### ` : `📍 `}${group.platform} (${group.date || 'No Date'})\n`;
        }

        group.items.forEach(item => {
            const split = splits[item.id];
            let assignedNames = 'Unassigned';

            if (split) {
                if (split.isAll) {
                    assignedNames = 'Everyone';
                } else if (split.personIds.length > 0) {
                    const names = split.personIds.map(id => people.find(p => p.id === id)?.name || 'Unknown');
                    assignedNames = names.join(', ');
                }
            }

            const price = item.price.toFixed(2);

            if (isMd) {
                output += `- **${item.name}**: ₹${price} _(${assignedNames})_\n`;
            } else {
                // Beautiful text padding?
                // Simple bullet is safer for WhatsApp
                output += `▫️ ${item.name}: ₹${price} (${assignedNames})\n`;
            }
        });
    });

    output += '\n';

    // Summary Section
    if (isMd) {
        output += `## Final Splits\n`;
    } else {
        output += `--- FINAL SPLITS ---\n`;
    }

    // Individual totals
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

    // Unassigned total
    if (result.unassignedTotal > 0) {
        if (isMd) {
            output += `- **Unassigned**: ₹${result.unassignedTotal.toFixed(2)}\n`;
        } else {
            output += `❓ ${'Unassigned'.padEnd(10)} : ₹${result.unassignedTotal.toFixed(2)}\n`;
        }
    }

    // Remainder?
    // Not showing remainder to keep it clean, usually negligible.

    // Grand Total
    const grandTotal = allItems.reduce((sum, i) => sum + i.price, 0);
    output += `\n💰 Total: ₹${grandTotal.toFixed(2)}`;

    return output.trim();
}
