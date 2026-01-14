export interface ModelConfig {
    id: string;
    displayName: string;
    supportsJsonMode: boolean;
    priority: number; // Lower number = higher priority
}

export const AVAILABLE_MODELS: ModelConfig[] = [
    {
        id: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        supportsJsonMode: true,
        priority: 1,
    },
    {
        id: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        supportsJsonMode: true,
        priority: 2,
    },
    {
        id: 'gemini-2.5-flash-lite',
        displayName: 'Gemini 2.5 Flash Lite',
        supportsJsonMode: true,
        priority: 3,
    },
    {
        id: 'gemma-3-12b-it',
        displayName: 'Gemma 3 12B',
        supportsJsonMode: false,
        priority: 4,
    },
    {
        id: 'gemma-3-27b-it',
        displayName: 'Gemma 3 27B',
        supportsJsonMode: false,
        priority: 5,
    },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

export function getModelConfig(modelId: string): ModelConfig | undefined {
    return AVAILABLE_MODELS.find(m => m.id === modelId);
}

export function getNextFallbackModel(currentModelId: string): ModelConfig | undefined {
    const currentModel = getModelConfig(currentModelId);
    if (!currentModel) return AVAILABLE_MODELS[0];

    // Find next model with higher priority number (lower priority)
    return AVAILABLE_MODELS.find(m => m.priority > currentModel.priority);
}
