import type { Item, SplitAssignment, Person } from '@/types';

export interface SplitResult {
    personTotals: Record<string, number>;
    unassignedTotal: number;
    grandTotal: number;
}

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

        // If no split record or no one assigned (and not All), it's unassigned
        if (!split || (!split.isAll && split.personIds.length === 0)) {
            unassignedTotalCents += priceCents;
            return;
        }

        const assignedIds = split.isAll ? people.map(p => p.id) : split.personIds;

        if (assignedIds.length === 0) {
            // Should be covered above but check again if people list is empty and isAll is true
            unassignedTotalCents += priceCents;
            return;
        }

        const count = assignedIds.length;
        const splitCents = Math.floor(priceCents / count);
        const remainder = priceCents - (splitCents * count);

        assignedIds.forEach((pid, index) => {
            // Distribute remainder to first N people (simple stable sort by index in array)
            const share = splitCents + (index < remainder ? 1 : 0);
            personTotals[pid] = (personTotals[pid] || 0) + share;
        });
    });

    // Convert cents back to float
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
}
