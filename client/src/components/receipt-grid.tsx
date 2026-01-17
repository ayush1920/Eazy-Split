import { useEffect, useState } from 'react';
import { useReceiptStore } from '@/store/useReceiptStore';
import { usePeopleStore } from '@/store/usePeopleStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Pencil, Upload } from 'lucide-react';
import type { ReceiptGroup, Item } from '@/types';
import { ItemEditModal } from './item-edit-modal';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export function ReceiptGrid() {
    const { groups, splits, updateGroup, deleteGroup, updateSplit, loadReceipts } = useReceiptStore();
    const { people } = usePeopleStore();
    const [editingItem, setEditingItem] = useState<{ group: ReceiptGroup, item: Item, isNewItem?: boolean } | null>(null);
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            if (theme === 'system') {
                setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
            } else {
                setIsDark(theme === 'dark');
            }
        };
        checkTheme();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkTheme);
        return () => mediaQuery.removeEventListener('change', checkTheme);
    }, [theme]);

    useEffect(() => {
        loadReceipts();
    }, [loadReceipts]);

    const handleSaveItem = async (id: string, name: string, price: number) => {
        if (!editingItem) return;
        const { group, isNewItem } = editingItem;

        if (isNewItem) {
            // This is a new item, add it to the group
            const newItem = { id, name, price };
            const updatedItems = [...group.items, newItem];
            await updateGroup({ ...group, items: updatedItems });
            // Initialize split for new item (default to 'All')
            await updateSplit(newItem.id, [], true);
        } else {
            // This is an existing item, update it
            const updatedItems = group.items.map(item =>
                item.id === id ? { ...item, name, price } : item
            );
            await updateGroup({ ...group, items: updatedItems });
        }
        setEditingItem(null);
    };

    const handleDeleteItem = async (id: string) => {
        if (!editingItem) return;
        const { group } = editingItem;
        const updatedItems = group.items.filter(item => item.id !== id);
        await updateGroup({ ...group, items: updatedItems });
        setEditingItem(null);
    };

    const toggleSplit = async (itemId: string, personId: string) => {
        const currentSplit = splits[itemId];
        if (!currentSplit) return;

        let newPersonIds = [...currentSplit.personIds];
        let newIsAll = currentSplit.isAll;

        if (personId === 'ALL') {
            newIsAll = !newIsAll;
            // If unchecking ALL, select everyone individually by default
            // giving the user a starting point where they can just uncheck the one person they want to exclude
            newPersonIds = newIsAll ? [] : people.map(p => p.id);
        } else {
            newIsAll = false;
            if (newPersonIds.includes(personId)) {
                newPersonIds = newPersonIds.filter(id => id !== personId);
            } else {
                newPersonIds.push(personId);
            }
        }

        await updateSplit(itemId, newPersonIds, newIsAll);
    };

    const isChecked = (itemId: string, personId: string) => {
        const split = splits[itemId];
        if (!split) return false;
        if (personId === 'ALL') return split.isAll;
        if (split.isAll) return true;
        return split.personIds.includes(personId);
    };

    return (
        <div className="space-y-8 w-full max-w-5xl mx-auto pb-20">
            {groups.length === 0 ? (
                <button
                    onClick={() => {
                        // Trigger the Add Receipt button
                        const uploadBtn = document.querySelector('button:has(svg.lucide-upload)') as HTMLButtonElement;
                        uploadBtn?.click();
                    }}
                    className={cn(
                        "w-full text-center py-20 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer group",
                        isDark
                            ? "bg-zinc-900/50 border-gray-700 hover:bg-zinc-800 hover:border-pink-500"
                            : "bg-transparent border-gray-300 hover:bg-pink-50 hover:border-pink-500"
                    )}
                >
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                    <p className="text-muted-foreground group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors font-medium">No receipts uploaded yet.</p>
                    <p className="text-sm text-muted-foreground mt-2 group-hover:text-pink-500 transition-colors">Click to upload</p>
                </button>
            ) : (
                groups.map((group) => (
                    <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-2 border-border rounded-xl bg-card text-card-foreground shadow-md hover:shadow-2xl hover:border-primary transition-all duration-300 overflow-hidden"
                    >
                        <div className="bg-muted/30 p-4 flex justify-between items-center border-b border-border">
                            <div>
                                <h3 className="font-semibold text-lg">{group.platform}</h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-muted-foreground">{group.date}</span>
                                    {group._modelUsed && (
                                        <span className="text-[10px] font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground" title="AI Model Used">
                                            model: {group._modelUsed}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => deleteGroup(group.id)}
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground hover:scale-110 p-3 rounded-lg transition-all duration-200"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/10">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[150px]">Item</th>
                                        <th className="px-4 py-3 w-[100px]">Price</th>
                                        <th className="px-4 py-3 w-[60px] text-center">All</th>
                                        {people.map(p => (
                                            <th key={p.id} className="px-4 py-3 w-[60px] text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] mb-1">{p.name}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <AnimatePresence>
                                        {group.items.map((item) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="bg-card hover:bg-accent/5 group/row"
                                            >
                                                <td
                                                    className="px-2 py-2 sm:px-4 sm:py-3 cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                                                    onClick={() => setEditingItem({ group, item })}
                                                >
                                                    <span className="truncate max-w-[150px] sm:max-w-xs">{item.name}</span>
                                                    <Pencil className="w-3 h-3 opacity-0 group-hover/row:opacity-100 text-muted-foreground" />
                                                </td>
                                                <td
                                                    className="px-2 py-2 sm:px-4 sm:py-3 cursor-pointer hover:text-primary transition-colors font-mono text-right"
                                                    onClick={() => setEditingItem({ group, item })}
                                                >
                                                    {item.price}
                                                </td>
                                                {/* Mobile: full cell clickable, Desktop: normal checkbox */}
                                                <td
                                                    className="px-2 py-3 sm:px-4 sm:py-3 text-center cursor-pointer sm:cursor-default active:bg-accent/20 sm:active:bg-transparent transition-colors select-none"
                                                    onClick={() => toggleSplit(item.id, 'ALL')}
                                                >
                                                    <div className="flex items-center justify-center min-h-[32px] sm:min-h-0 min-w-[32px] sm:min-w-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked(item.id, 'ALL')}
                                                            onChange={() => { }}
                                                            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-input text-primary focus:ring-ring pointer-events-none sm:pointer-events-auto sm:cursor-pointer transition-transform duration-200 hover:scale-110"
                                                        />
                                                    </div>
                                                </td>
                                                {people.map(p => (
                                                    <td
                                                        key={p.id}
                                                        className={`px-2 py-3 sm:px-4 sm:py-3 text-center cursor-pointer sm:cursor-default transition-colors select-none ${isChecked(item.id, 'ALL')
                                                            ? 'opacity-40 cursor-not-allowed'
                                                            : 'active:bg-accent/20 sm:active:bg-transparent'
                                                            }`}
                                                        onClick={() => !isChecked(item.id, 'ALL') && toggleSplit(item.id, p.id)}
                                                    >
                                                        <div className="flex items-center justify-center min-h-[32px] sm:min-h-0 min-w-[32px] sm:min-w-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked(item.id, p.id)}
                                                                disabled={isChecked(item.id, 'ALL')}
                                                                onChange={() => { }}
                                                                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-input text-primary focus:ring-ring disabled:opacity-30 pointer-events-none sm:pointer-events-auto sm:cursor-pointer transition-transform duration-200 hover:scale-110"
                                                            />
                                                        </div>
                                                    </td>
                                                ))}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-muted/10 border-t border-border flex justify-center">
                            <button
                                onClick={() => {
                                    const newItem = { id: crypto.randomUUID(), name: 'New Item', price: 0 };
                                    // Don't add to store yet, just open modal with isNewItem flag
                                    setEditingItem({ group, item: newItem, isNewItem: true });
                                }}
                                className="flex items-center gap-1 text-sm text-primary hover:text-primary hover:scale-105 transition-all duration-200 font-medium hover:gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Item manually
                            </button>
                        </div>
                    </motion.div>
                ))
            )}

            <ItemEditModal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                item={editingItem?.item || null}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
            />
        </div>
    );
}
