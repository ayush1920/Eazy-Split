import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Item } from '@/types';
import { X } from 'lucide-react';
import { useTheme } from "@/components/theme-provider";
import { cn } from '@/lib/utils';

interface ItemEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Item | null;
    onSave: (id: string, name: string, price: number) => void;
    onDelete?: (id: string) => void;
}

export function ItemEditModal({ isOpen, onClose, item, onSave, onDelete }: ItemEditModalProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    // JS Theme Detection Logic
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
        if (item) {
            setName(item.name);
            setPrice(item.price.toString());
        }
    }, [item]);

    const handleSave = () => {
        if (item) {
            onSave(item.id, name, parseFloat(price) || 0);
            onClose();
        }
    };

    const handleDelete = () => {
        if (item && onDelete) {
            onDelete(item.id);
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-none transition-opacity opacity-100" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={cn(
                                "w-full max-w-md transform overflow-hidden rounded-2xl border border-border p-6 text-left align-middle shadow-xl transition-all",
                                isDark ? "bg-zinc-900" : "bg-white"
                            )}>
                                <Dialog.Title
                                    as="h3"
                                    className={cn(
                                        "text-lg font-medium leading-6 flex justify-between items-center",
                                        isDark ? "text-white" : "text-black"
                                    )}
                                >
                                    Edit Item
                                    <button
                                        onClick={onClose}
                                        className={cn(
                                            "transition-colors p-2 rounded-lg hover:bg-muted",
                                            isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </Dialog.Title>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className={cn("block text-sm font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Item Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={cn(
                                                "w-full px-3 py-2 rounded-md border border-input text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                                                isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-900"
                                            )}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className={cn("block text-sm font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Price</label>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className={cn(
                                                "w-full px-3 py-2 rounded-md border border-input text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                                                isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-900"
                                            )}
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-between items-center">
                                        <div>
                                            {onDelete && (
                                                <button
                                                    onClick={handleDelete}
                                                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:bg-destructive/90 transition-all duration-200"
                                                >
                                                    Delete Item
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={onClose}
                                                className={cn(
                                                    "px-4 py-2 border border-border rounded-xl text-sm font-medium transition-all duration-200",
                                                    isDark ? "text-gray-300 hover:bg-zinc-800" : "text-gray-700 hover:bg-gray-100"
                                                )}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all duration-200"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
