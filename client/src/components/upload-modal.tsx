import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { Upload, X, Loader2, CheckCircle, ChevronDown, Check, Trash2, ImageIcon, Clipboard } from 'lucide-react';
import { useTheme } from "@/components/theme-provider";
import { useReceiptStore } from '@/store/useReceiptStore';
import { useModelStore } from '@/store/useModelStore';
import { uploadReceipt } from '@/lib/ocr';
import { cn } from '@/lib/utils';
import type { ReceiptGroup } from '@/types';

interface PendingImage {
    id: string;
    file: File;
    preview: string; // blob URL for preview
    platform: string;
    date: string;
}

export function UploadModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedGroups, setProcessedGroups] = useState<ReceiptGroup[]>([]);
    const [currentStep, setCurrentStep] = useState<'upload' | 'review'>('upload');
    const [error, setError] = useState<string | null>(null);
    const [processingIndex, setProcessingIndex] = useState<number>(-1);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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

    // Paste Event Listener
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isOpen || isProcessing) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            const imageFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) imageFiles.push(file);
                }
            }

            if (imageFiles.length > 0) {
                e.preventDefault(); // Prevent default paste behavior
                addImagesToPreview(imageFiles);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, isProcessing]);

    const handlePasteClick = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            const imageFiles: File[] = [];

            for (const item of clipboardItems) {
                // If it's an image, get the blob
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    // Convert blob to file
                    const file = new File([blob], "pasted-image.png", { type: imageType });
                    imageFiles.push(file);
                }
            }

            if (imageFiles.length > 0) {
                addImagesToPreview(imageFiles);
            } else {
                setError("No images found in clipboard");
            }
        } catch (err: any) {
            console.error("Clipboard error:", err);
            // Handle permission errors or no support
            if (err.name === 'NotAllowedError') {
                setError("Clipboard permission denied. Please allow access.");
            } else {
                setError("Could not read from clipboard. Try Ctrl+V instead.");
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addImagesToPreview(Array.from(e.target.files));
        }
    };

    const addImagesToPreview = (files: File[]) => {
        const todayDate = new Date().toISOString().split('T')[0];

        const newImages: PendingImage[] = files.map(file => ({
            id: crypto.randomUUID(),
            file,
            preview: URL.createObjectURL(file),
            platform: 'Zepto', // Default platform
            date: todayDate
        }));

        setPendingImages(prev => [...prev, ...newImages]);
        setError(null);
    };

    const removeImage = (id: string) => {
        const img = pendingImages.find(i => i.id === id);
        if (img) {
            URL.revokeObjectURL(img.preview); // Prevent memory leak
        }
        setPendingImages(prev => prev.filter(i => i.id !== id));
    };

    const updateImage = (id: string, field: 'platform' | 'date', value: string) => {
        setPendingImages(prev => prev.map(img =>
            img.id === id ? { ...img, [field]: value } : img
        ));
    };

    const handleBatchProcess = async () => {
        if (pendingImages.length === 0) return;

        setIsProcessing(true);
        setError(null);
        const results: ReceiptGroup[] = [];

        // Get model preference from store
        const { preferences } = useModelStore.getState();
        const selectedModel = preferences?.selectedModel;
        const autoMode = preferences?.autoMode ?? true;

        try {
            for (let i = 0; i < pendingImages.length; i++) {
                const img = pendingImages[i];
                setProcessingIndex(i);

                try {
                    const group = await uploadReceipt(img.file, selectedModel, autoMode);
                    group.platform = img.platform;
                    group.date = img.date;
                    results.push(group);

                    // Log which model was used
                    if (group._modelUsed) {
                        console.log(`Receipt ${i + 1} processed using model: ${group._modelUsed}`);
                    }
                } catch (err: any) {
                    console.error(`Failed to process image ${i + 1}:`, err);
                    // Throw error to abort the entire batch
                    throw new Error(`Failed to process image ${i + 1}: ${err.message}`);
                }
            }

            setProcessedGroups(results);
            setCurrentStep('review');

            // Clean up blob URLs
            pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
            setPendingImages([]);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to process receipts. Ensure Backend is running.");
        } finally {
            setIsProcessing(false);
            setProcessingIndex(-1);
        }
    };

    const handleSave = async () => {
        if (processedGroups.length === 0) return;
        for (const group of processedGroups) {
            await addGroup(group);
        }
        closeModal();
    };

    const closeModal = () => {
        // Clean up blob URLs
        pendingImages.forEach(img => URL.revokeObjectURL(img.preview));

        setIsOpen(false);
        setCurrentStep('upload');
        setPendingImages([]);
        setProcessedGroups([]);
        setError(null);
        setProcessingIndex(-1);
    };

    // Helper to update a specific processed group in the review list
    const updateProcessedGroup = (index: number, field: keyof ReceiptGroup, value: any) => {
        const newGroups = [...processedGroups];
        newGroups[index] = { ...newGroups[index], [field]: value };
        setProcessedGroups(newGroups);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-pink-500 text-white rounded-xl px-5 py-2.5 font-semibold text-sm shadow-md hover:bg-pink-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Add Receipt</span>
            </button>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isProcessing && closeModal()}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity opacity-100" />
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
                                    "w-full max-w-4xl transform overflow-hidden rounded-2xl border-2 p-6 text-left align-middle shadow-2xl transition-all",
                                    isDark ? "bg-zinc-900 border-gray-700" : "bg-white border-gray-200"
                                )}>
                                    <Dialog.Title
                                        as="h3"
                                        className={cn(
                                            "text-lg font-medium leading-6 flex justify-between items-center",
                                            isDark ? "text-white" : "text-black"
                                        )}
                                    >
                                        {currentStep === 'review'
                                            ? `Review ${processedGroups.length} Receipt(s)`
                                            : pendingImages.length > 0
                                                ? `Preview ${pendingImages.length} Image(s)`
                                                : "Upload Receipts"}
                                        {!isProcessing && (
                                            <button
                                                onClick={closeModal}
                                                className={cn(
                                                    "transition-colors p-2 rounded-lg hover:bg-muted",
                                                    isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                                                )}
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </Dialog.Title>

                                    <div className="mt-6">
                                        {currentStep === 'review' && processedGroups.length > 0 ? (
                                            // Review Step - Show processed receipts
                                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                                {processedGroups.map((group, index) => (
                                                    <div key={index} className="p-4 border border-border rounded-lg bg-muted/10 relative">
                                                        <div className="absolute top-2 right-2 text-primary">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </div>
                                                        <h4 className={cn("text-sm font-semibold mb-3", isDark ? "text-gray-100" : "text-gray-900")}>Receipt #{index + 1}</h4>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className={cn("block text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Platform</label>
                                                                <Listbox value={group.platform} onChange={(value) => updateProcessedGroup(index, 'platform', value)}>
                                                                    {({ open }) => (
                                                                        <div className="relative">
                                                                            <Listbox.Button className={cn(
                                                                                "w-full px-3 py-2 rounded-md border border-input text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-between",
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
                                                                                                    active ? "bg-primary text-primary-foreground" : cn("hover:bg-muted", isDark ? "text-gray-100" : "text-gray-900")
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            {({ selected, active }) => (
                                                                                                <>
                                                                                                    <span className={cn("block truncate", selected ? "font-bold" : "font-normal")}>
                                                                                                        {platform}
                                                                                                    </span>
                                                                                                    {selected && (
                                                                                                        <span className={cn("absolute inset-y-0 left-0 flex items-center pl-3", active ? "text-primary-foreground" : "text-primary")}>
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
                                                                    onChange={(e) => updateProcessedGroup(index, 'date', e.target.value)}
                                                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                                                    className={cn(
                                                                        "w-full px-3 py-2 rounded-md border border-input text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
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
                                                            "px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted hover:border-primary hover:text-primary transition-all duration-200",
                                                            isDark ? "text-gray-300" : "text-gray-700"
                                                        )}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
                                                    >
                                                        Save All
                                                    </button>
                                                </div>
                                            </div>
                                        ) : pendingImages.length > 0 ? (
                                            // Preview Step - Show image previews with metadata
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                                                    {pendingImages.map((img, index) => (
                                                        <div key={img.id} className={cn(
                                                            "border-2 rounded-lg p-3 relative transition-all",
                                                            isProcessing && processingIndex === index
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border bg-muted/5"
                                                        )}>
                                                            {!isProcessing && (
                                                                <button
                                                                    onClick={() => removeImage(img.id)}
                                                                    className={cn(
                                                                        "absolute -top-2 -right-2 p-2 rounded-full transition-all z-10 shadow-lg border-2 border-[#FD366E]",
                                                                        isDark
                                                                            ? "bg-zinc-900 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                                            : "bg-white text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                                    )}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}

                                                            <div className="relative mb-3 group">
                                                                <img
                                                                    src={img.preview}
                                                                    alt={`Preview ${index + 1}`}
                                                                    onClick={() => setPreviewImageUrl(img.preview)}
                                                                    className="w-full h-32 sm:h-40 object-cover rounded border-2 border-border hover:border-pink-500 hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Click to view</span>
                                                                </div>
                                                                {isProcessing && processingIndex === index && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                                                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div>
                                                                    <label className={cn("block text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Platform</label>
                                                                    <Listbox value={img.platform} onChange={(value) => updateImage(img.id, 'platform', value)} disabled={isProcessing}>
                                                                        {({ open }) => (
                                                                            <div className="relative">
                                                                                <Listbox.Button className={cn(
                                                                                    "w-full px-2 py-1.5 rounded border border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-between",
                                                                                    isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-900",
                                                                                    isProcessing && "opacity-50 cursor-not-allowed"
                                                                                )}>
                                                                                    <span>{img.platform}</span>
                                                                                    <ChevronDown className={cn("w-3 h-3 transition-transform text-gray-500", open && "rotate-180")} />
                                                                                </Listbox.Button>
                                                                                <Transition
                                                                                    as={Fragment}
                                                                                    leave="transition ease-in duration-100"
                                                                                    leaveFrom="opacity-100"
                                                                                    leaveTo="opacity-0"
                                                                                >
                                                                                    <Listbox.Options className={cn(
                                                                                        "absolute z-10 mt-1 w-full border-2 border-border rounded-lg shadow-2xl max-h-48 overflow-auto focus:outline-none text-xs ring-0",
                                                                                        isDark ? "bg-zinc-900" : "bg-white"
                                                                                    )}>
                                                                                        {['Zepto', 'Blinkit', 'Instamart', 'Swiggy', 'Zomato', 'Amazon', 'Now', 'Other'].map((platform) => (
                                                                                            <Listbox.Option
                                                                                                key={platform}
                                                                                                value={platform}
                                                                                                className={({ active }) =>
                                                                                                    cn(
                                                                                                        "cursor-pointer select-none relative py-1.5 pl-8 pr-3 transition-colors duration-150",
                                                                                                        active ? "bg-primary text-primary-foreground" : cn("hover:bg-muted", isDark ? "text-gray-100" : "text-gray-900")
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {({ selected, active }) => (
                                                                                                    <>
                                                                                                        <span className={cn("block truncate", selected ? "font-bold" : "font-normal")}>
                                                                                                            {platform}
                                                                                                        </span>
                                                                                                        {selected && (
                                                                                                            <span className={cn("absolute inset-y-0 left-0 flex items-center pl-2", active ? "text-primary-foreground" : "text-primary")}>
                                                                                                                <Check className="w-3 h-3" />
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
                                                                        value={img.date}
                                                                        onChange={(e) => updateImage(img.id, 'date', e.target.value)}
                                                                        onClick={(e) => e.currentTarget.showPicker?.()}
                                                                        disabled={isProcessing}
                                                                        className={cn(
                                                                            "w-full px-2 py-1.5 rounded border border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
                                                                            isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-900",
                                                                            isProcessing && "opacity-50 cursor-not-allowed"
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add more images button */}
                                                {!isProcessing && (
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <label
                                                            htmlFor="add-more-files"
                                                            className={cn(
                                                                "flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200",
                                                                isDark ? "border-gray-600 hover:border-primary hover:bg-primary/5 text-gray-400 hover:text-primary" : "border-gray-300 hover:border-primary hover:bg-primary/5 text-gray-500 hover:text-primary"
                                                            )}
                                                        >
                                                            <ImageIcon className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Add Images</span>
                                                            <input
                                                                id="add-more-files"
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={handleFileChange}
                                                            />
                                                        </label>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handlePasteClick();
                                                            }}
                                                            className={cn(
                                                                "flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200",
                                                                isDark ? "border-gray-600 hover:border-pink-500 hover:bg-pink-500/5 text-pink-400" : "border-gray-300 hover:border-pink-500 hover:bg-pink-50/50 text-pink-600"
                                                            )}
                                                        >
                                                            <Clipboard className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Paste Clipboard</span>
                                                            <span className="hidden sm:inline text-xs opacity-50 ml-1">(Ctrl+V)</span>
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Process button */}
                                                <div className="pt-4 flex justify-end gap-2 border-t border-border">
                                                    <button
                                                        onClick={closeModal}
                                                        disabled={isProcessing}
                                                        className={cn(
                                                            "border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 font-medium text-sm hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400 active:scale-[0.98] transition-all duration-300",
                                                            isProcessing && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleBatchProcess}
                                                        disabled={isProcessing}
                                                        className={cn(
                                                            "flex items-center gap-2 bg-pink-500 text-white rounded-xl px-5 py-2.5 font-semibold text-sm shadow-md hover:bg-pink-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300",
                                                            isProcessing && "opacity-75 cursor-not-allowed"
                                                        )}
                                                    >
                                                        {isProcessing ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Processing {processingIndex + 1}/{pendingImages.length}
                                                            </>
                                                        ) : (
                                                            `Process ${pendingImages.length} Image${pendingImages.length > 1 ? 's' : ''}`
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // Upload Step - Initial file selection
                                            <div className="flex flex-col items-center justify-center w-full">
                                                <label
                                                    htmlFor="dropzone-file"
                                                    className={cn(
                                                        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/5 hover:bg-muted/10 transition-colors",
                                                        isDark ? "border-gray-500 hover:border-primary/50" : "border-gray-300 hover:border-primary/50"
                                                    )}
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className={cn("w-10 h-10 mb-3", isDark ? "text-gray-400" : "text-gray-500")} />
                                                        <p className={cn("mb-2 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                                        </p>
                                                        <p className={cn("text-xs mb-3", isDark ? "text-gray-400" : "text-gray-500")}>
                                                            Select one or multiple receipt images
                                                        </p>

                                                        {/* Paste Button for Mobile/Click Support */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handlePasteClick();
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                                                isDark
                                                                    ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-pink-400"
                                                                    : "bg-pink-50 border-pink-100 hover:bg-pink-100 text-pink-600"
                                                            )}
                                                        >
                                                            <Clipboard className="w-3.5 h-3.5" />
                                                            Paste from Clipboard
                                                        </button>

                                                        <p className={cn("text-[10px] mt-2 opacity-60", isDark ? "text-gray-500" : "text-gray-400")}>
                                                            or use Ctrl+V
                                                        </p>
                                                    </div>
                                                    <input
                                                        id="dropzone-file"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleFileChange}
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

            {/* Full Image Preview Modal */}
            {previewImageUrl && (
                <Transition appear show={!!previewImageUrl} as={Fragment}>
                    <Dialog as="div" className="relative z-[60]" onClose={() => setPreviewImageUrl(null)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="relative max-w-5xl w-full">
                                        <button
                                            onClick={() => setPreviewImageUrl(null)}
                                            className="absolute -top-12 right-0 p-2 text-white hover:text-primary transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                        <img
                                            src={previewImageUrl}
                                            alt="Full preview"
                                            className="w-full h-auto max-h-[90vh] object-contain rounded-lg border-2 border-pink-500 shadow-2xl"
                                        />
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            )}
        </>
    );
}
