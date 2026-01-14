import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Listbox, Transition, Switch } from '@headlessui/react';
import { Settings, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useModelStore } from '@/store/useModelStore';
import {
    fetchAvailableModels
} from '@/lib/models';
import { cn } from '@/lib/utils';

export function SettingsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(false);

    const { models, preferences, setModels, setPreferences } = useModelStore();

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
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const modelsData = await fetchAvailableModels();
            setModels(modelsData);

            // Initialize preferences if null
            if (!preferences && modelsData.length > 0) {
                setPreferences({
                    selectedModel: modelsData[0].id,
                    autoMode: true
                });
            }
        } catch (error) {
            console.error('Failed to load model data:', error);
        }
    };

    const handleModelChange = (modelId: string) => {
        setPreferences({
            selectedModel: modelId,
            autoMode: preferences?.autoMode ?? true
        });
    };

    const handleAutoModeToggle = (enabled: boolean) => {
        setPreferences({
            selectedModel: preferences?.selectedModel || models[0]?.id,
            autoMode: enabled
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "inline-flex justify-center items-center rounded-xl border-2 border-border bg-background p-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-[#FD366E] focus:outline-none focus:ring-2 focus:ring-[#FD366E] focus:ring-offset-2 transition-all duration-200 group"
                )}
                aria-label="Settings"
            >
                <div className="relative h-[1.2rem] w-[1.2rem]">
                    <Settings className={cn("absolute inset-0 h-[1.2rem] w-[1.2rem] transition-all duration-300 group-hover:rotate-45")} />
                </div>
            </button>

            {isOpen && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[100] bg-black/20"
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Panel */}
                    <div
                        className={cn(
                            "fixed top-20 right-4 w-80 rounded-xl border-2 border-border shadow-2xl z-[101] p-4",
                            isDark ? "bg-zinc-900" : "bg-white"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-black")}>
                            Model Settings
                        </h3>

                        <div className="space-y-4">
                            {/* Auto Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                                    Auto Fallback
                                </span>
                                <Switch
                                    checked={preferences?.autoMode ?? true}
                                    onChange={handleAutoModeToggle}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        preferences?.autoMode ? "bg-[#FD366E]" : isDark ? "bg-zinc-700" : "bg-gray-300"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            preferences?.autoMode ? "translate-x-6" : "translate-x-1"
                                        )}
                                    />
                                </Switch>
                            </div>

                            {/* Model Selection */}
                            <div>
                                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                                    Preferred Model
                                </label>
                                <Listbox value={preferences?.selectedModel || models[0]?.id} onChange={handleModelChange}>
                                    {({ open }) => (
                                        <div className="relative">
                                            <Listbox.Button
                                                className={cn(
                                                    "w-full px-3 py-2 rounded-md border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-between",
                                                    isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-900"
                                                )}
                                            >
                                                <span>
                                                    {models.find(m => m.id === preferences?.selectedModel)?.displayName || 'Select model'}
                                                </span>
                                                <ChevronDown className={cn("w-4 h-4 transition-transform text-gray-500", open && "rotate-180")} />
                                            </Listbox.Button>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options
                                                    className={cn(
                                                        "absolute z-10 mt-1 w-full border-2 border-border rounded-lg shadow-2xl max-h-60 overflow-auto focus:outline-none text-sm",
                                                        isDark ? "bg-zinc-900" : "bg-white"
                                                    )}
                                                >
                                                    {models.map((model) => (
                                                        <Listbox.Option
                                                            key={model.id}
                                                            value={model.id}
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
                                                                        {model.displayName}
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

                            <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
                                Auto fallback will try the next model if the current one exceeds quota.
                            </p>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
