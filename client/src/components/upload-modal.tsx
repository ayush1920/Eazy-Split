import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { Upload, X, Loader2, CheckCircle, ChevronDown, Check } from 'lucide-react';
import { useTheme } from "@/components/theme-provider";
import { useReceiptStore } from '@/store/useReceiptStore';
import { useModelStore } from '@/store/useModelStore';
import { uploadReceipt } from '@/lib/ocr';
import { cn } from '@/lib/utils';
import type { ReceiptGroup } from '@/types';

export function UploadModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingGroups, setPendingGroups] = useState<ReceiptGroup[]>([]);
    const [reviewStep, setReviewStep] = useState(false);

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

    const { addGroup } = useReceiptStore();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = async (files: File[]) => {
        setIsUploading(true);
        setError(null);
        const results: ReceiptGroup[] = [];
        const todayDate = new Date().toISOString().split('T')[0]; // Get browser's current date

        // Get model preference from store
        const { preferences } = useModelStore.getState();
        const selectedModel = preferences?.selectedModel;
        const autoMode = preferences?.autoMode ?? true;

        try {
            for (const file of files) {
                const group = await uploadReceipt(file, selectedModel, autoMode);
                // Ensure date is today's date from browser, and platform is a default
                group.date = todayDate;
                ṇ
                // Log which model was used
                if (group._modelUsed) {
                    console.log(`Receipt processed using model: ${group._modelUsed}`);
                }

                results.push(group);
            }
            setPendingGroups(results);
            setReviewStep(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to process receipts. Ensure Backend is running.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (pendingGroups.length === 0) return;
        for (const group of pendingGroups) {
            await addGroup(group);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsOpen(false);
        setReviewStep(false);
        setPendingGroups([]);
        setError(null);
    };

    // Helper to update a specific pending group in the review list
    const updatePendingGroup = (index: number, field: keyof ReceiptGroup, value: any) => {
        const newGroups = [...pendingGroups];
        newGroups[index] = { ...newGroups[index], [field]: value };
        setPendingGroups(newGroups);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-[#FD366E]/40 hover:bg-[#FD366E]/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm font-semibold"
            >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Add Receipt</span>
            </button>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isUploading && closeModal()}>
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
                                    "w-full max-w-lg transform overflow-hidden rounded-2xl border-2 border-border p-6 text-left align-middle shadow-2xl transition-all opacity-100",
                                    isDark ? "bg-zinc-900" : "bg-white"
                                )}>
                                    <Dialog.Title
                                        as="h3"
                                        className={cn(
                                            "text-lg font-medium leading-6 flex justify-between items-center",
                                            isDark ? "text-white" : "text-black"
                                        )}
                                    >
                                        {reviewStep ? `Review ${pendingGroups.length} Receipt(s)` : "Upload Receipts"}
                                        {!isUploading && (
                                            <button
                                                onClick={closeModal}
                                                className={cn(
                                                    "transition-colors",
                                                    isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                                                )}
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </Dialog.Title>

                                    <div className="mt-6">
                                        {reviewStep && pendingGroups.length > 0 ? (
                                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                                {pendingGroups.map((group, index) => (
                                                    <div key={index} className="p-4 border border-border rounded-lg bg-muted/10 relative">
                                                        <div className="absolute top-2 right-2 text-primary">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </div>
                                                        <h4 className={cn("text-sm font-semibold mb-3", isDark ? "text-gray-100" : "text-gray-900")}>Receipt #{index + 1}</h4>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className={cn("block text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Platform</label>
                                                                <Listbox value={group.platform} onChange={(value) => updatePendingGroup(index, 'platform', value)}>
                                                                    {({ open }) => (
                                                                        <div className="relative">
                                                                            <Listbox.Button className={cn(
                                                                                "w-full px-3 py-2 rounded-md border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-between",
                                                                                isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-900"
                                                                            )}>
                                                                                <span>{group.platform}</span>
                                                                                <ChevronDown className={cn("w-4 h-4 transition-transform text-gray-500", open && "rotate-180")} />
                                                                            </Listbox.Button>
                                                                            <Transition
                                                                                as={Fragment}
                                                                                leave="transition ease-in duration-100"
                                                                                leaveFrom="opacity-100"
                                                                                leaveTo="opacity-0"
                                                                            >
                                                                                <Listbox.Options className={cn(
                                                                                    "absolute z-10 mt-1 w-full border-2 border-border rounded-lg shadow-2xl max-h-60 overflow-auto focus:outline-none text-sm ring-0",
                                                                                    isDark ? "bg-zinc-900" : "bg-white"
                                                                                )}>
                                                                                    {['Zepto', 'Blinkit', 'Instamart', 'Swiggy', 'Zomato', 'Amazon', 'Now', 'Other'].map((platform) => (
                                                                                        <Listbox.Option
                                                                                            key={platform}
                                                                                            value={platform}
                                                                                            className={({ active }) =>
                                                                                                cn(
                                                                                                    "cursor-pointer select-none relative py-2 pl-10 pr-4 transition-colors duration-150",
                                                                                                    active ? "bg-[#FD366E] text-white" : cn("hover:bg-muted", isDark ? "text-gray-100" : "text-gray-900")
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            {({ selected, active }) => (
                                                                                                <>
                                                                                                    <span className={cn("block truncate", selected ? "font-bold" : "font-normal")}>
                                                                                                        {platform}
                                                                                                    </span>
                                                                                                    {selected && (
                                                                                                        <span className={cn("absolute inset-y-0 left-0 flex items-center pl-3", active ? "text-white" : "text-[#FD366E]")}>
                                                                                                            <Check className="w-4 h-4" />
                                                                                                        </span>
                                                                                                    )}
                                                                                                </>
                                                                                            )}
                                                                                        </Listbox.Option>
                                                                                    ))}
                                                                                </Listbox.Options>
                                                                            </Transition>
                                                                        </div>
                                                                    )}
                                                                </Listbox>
                                                            </div>
                                                            <div>
                                                                <label className={cn("block text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={group.date}
                                                                    onChange={(e) => updatePendingGroup(index, 'date', e.target.value)}
                                                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                                                    className={cn(
                                                                        "w-full px-3 py-2 rounded-md border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
                                                                        isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-900"
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="pt-4 flex justify-end gap-2 sticky bottom-0 bg-card py-2 border-t border-border">
                                                    <button
                                                        onClick={closeModal}
                                                        className={cn(
                                                            "px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted hover:border-[#FD366E] hover:text-[#FD366E] transition-all duration-200",
                                                            isDark ? "text-gray-300" : "text-gray-700"
                                                        )}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        className="px-4 py-2 bg-[#FD366E] text-white rounded-xl text-sm font-bold hover:bg-[#FD366E]/90 hover:shadow-lg hover:shadow-[#FD366E]/25 transition-all duration-200"
                                                    >
                                                        Save All
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center w-full">
                                                <label
                                                    htmlFor="dropzone-file"
                                                    className={cn(
                                                        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/5 hover:bg-muted/10 transition-colors",
                                                        isUploading ? "opacity-50 cursor-not-allowed" : cn("hover:border-primary/50", isDark ? "border-gray-500" : "border-gray-300"),
                                                        error ? "border-destructive/50" : ""
                                                    )}
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        {isUploading ? (
                                                            <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                                                        ) : (
                                                            <Upload className={cn("w-10 h-10 mb-3", isDark ? "text-gray-400" : "text-gray-500")} />
                                                        )}
                                                        <p className={cn("mb-2 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                                                            {isUploading ? "Processing with AI..." : <span className="font-semibold">Click to upload</span>}
                                                        </p>
                                                        <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                                                            {isUploading ? "This may take a few seconds" : "Select multiple images if needed"}
                                                        </p>
                                                    </div>
                                                    <input
                                                        id="dropzone-file"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleFileChange}
                                                        disabled={isUploading}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                        {error && (
                                            <p className="mt-2 text-sm text-destructive text-center">{error}</p>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
