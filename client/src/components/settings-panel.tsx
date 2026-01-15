import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Listbox, Transition, Switch } from '@headlessui/react';
import { Settings, ChevronDown } from 'lucide-react';
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
    const [loading, setLoading] = useState(false);

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
        setLoading(true);
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
        } finally {
            setLoading(false);
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
                className="inline-flex justify-center items-center group border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 font-medium text-sm hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400 active:scale-[0.98] transition-all duration-300"
                aria-label="Settings"
            >
                <div className="relative h-[1.2rem] w-[1.2rem]">
                    <Settings className="absolute inset-0 h-[1.2rem] w-[1.2rem] transition-transform duration-300 group-hover:rotate-45" />
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
                                <span className={cn("text-sm font-medium", isDark ? "text-gray-200" : "text-gray-900")}>
                                    Auto Fallback
                                </span>
                                <Switch
                                    checked={preferences?.autoMode ?? true}
                                    onChange={handleAutoModeToggle}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                                        preferences?.autoMode
                                            ? "bg-pink-500"
                                            : isDark
                                                ? "bg-gray-700"
                                                : "bg-gray-300"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
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
                                <Listbox
                                    value={preferences?.selectedModel || models[0]?.id || ''}
                                    onChange={handleModelChange}
                                    disabled={loading || models.length === 0}
                                >
                                    {({ open }) => (
                                        <div className="relative">
                                            <Listbox.Button
                                                className={cn(
                                                    "w-full px-3 py-2 rounded-md border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-between",
                                                    isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-900",
                                                    (loading || models.length === 0) && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <span>
                                                    {loading ? "Loading models..." :
                                                        models.length === 0 ? "No models found" :
                                                            (models.find(m => m.id === (preferences?.selectedModel || models[0]?.id))?.displayName || 'Select model')}
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
                                                        "absolute z-10 mt-1 w-full border-2 rounded-lg shadow-2xl max-h-60 overflow-auto focus:outline-none text-sm",
                                                        isDark ? "bg-zinc-900 border-gray-700" : "bg-white border-gray-200"
                                                    )}
                                                >
                                                    {models.map((model) => (
                                                        <Listbox.Option
                                                            key={model.id}
                                                            value={model.id}
                                                            className={({ active, selected }) =>
                                                                cn(
                                                                    "relative cursor-pointer select-none py-3 pl-4 pr-4 transition-all duration-200",
                                                                    selected
                                                                        ? "bg-pink-500 text-white font-semibold"
                                                                        : active
                                                                            ? isDark
                                                                                ? "bg-pink-500/20 text-pink-300"
                                                                                : "bg-pink-100 text-pink-700"
                                                                            : isDark
                                                                                ? "text-gray-300"
                                                                                : "text-gray-700"
                                                                )
                                                            }
                                                        >
                                                            {() => (
                                                                <span className="block truncate">
                                                                    {model.displayName}
                                                                </span>
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
