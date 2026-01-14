import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModelConfig, ModelPreferences } from '@/lib/models';

interface ModelStore {
    models: ModelConfig[];
    preferences: ModelPreferences | null;

    setModels: (models: ModelConfig[]) => void;
    setPreferences: (preferences: ModelPreferences) => void;
}

export const useModelStore = create<ModelStore>()(
    persist(
        (set) => ({
            models: [],
            preferences: null,

            setModels: (models) => set({ models }),
            setPreferences: (preferences) => set({ preferences }),
        }),
        {
            name: 'model-storage',
        }
    )
);
