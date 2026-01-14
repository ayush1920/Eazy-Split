import { create } from 'zustand';
import type { ReceiptGroup, Item, SplitAssignment } from '@/types';
import { dbPromise } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

export const useReceiptStore = create<ReceiptState>((set, get) => ({
    groups: [],
    splits: {},
    loading: true,
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
    },
    addGroup: async (group) => {
        const db = await dbPromise;
        const state = get();

        // Check for existing group with same platform and date
        const existingGroup = state.groups.find(g => g.platform === group.platform && g.date === group.date);

        if (existingGroup) {
            // Merge items into existing group
            const updatedGroup = {
                ...existingGroup,
                items: [...existingGroup.items, ...group.items]
            };
            await db.put('receipts', updatedGroup);
            set(state => ({
                groups: state.groups.map(g => g.id === existingGroup.id ? updatedGroup : g)
            }));
        } else {
            // Create new group
            await db.put('receipts', group);
            set(state => ({ groups: [...state.groups, group] }));
        }

        // Initialize splits for the NEW items (whether merged or new group)
        const newSplits: Record<string, SplitAssignment> = {};
        for (const item of group.items) {
            const split = { itemId: item.id, personIds: [], isAll: true };
            await db.put('splits', split);
            newSplits[item.id] = split;
        }
        set(state => ({ splits: { ...state.splits, ...newSplits } }));
    },
    updateGroup: async (group) => {
        const db = await dbPromise;
        await db.put('receipts', group);
        set(state => ({
            groups: state.groups.map(g => (g.id === group.id ? group : g))
        }));
    },
    deleteGroup: async (id) => {
        const db = await dbPromise;
        await db.delete('receipts', id);
        set(state => ({ groups: state.groups.filter(g => g.id !== id) }));
    },
    updateSplit: async (itemId, personIds, isAll) => {
        const split: SplitAssignment = { itemId, personIds, isAll };
        const db = await dbPromise;
        await db.put('splits', split);
        set(state => ({
            splits: { ...state.splits, [itemId]: split }
        }));
    }
}));
