export interface ModelConfig {
    id: string;
    displayName: string;
    supportsJsonMode: boolean;
    priority: number; // Lower number = higher priority
}

export const AVAILABLE_MODELS: ModelConfig[] = [
    {
        id: 'gemini-3.1-flash',
        displayName: 'Gemini 3.1 Flash',
        supportsJsonMode: true,
        priority: 1,
    },
    {
        id: 'gemini-3.5-flash',
        displayName: 'Gemini 3.5 Flash',
        supportsJsonMode: true,
        priority: 2,
    },
    {
        id: 'gemini-3-flash',
        displayName: 'Gemini 3 Flash',
        supportsJsonMode: true,
        priority: 3,
    },
    {
        id: 'gemini-3.1-flash-lite',
        displayName: 'Gemini 3.1 Flash Lite',
        supportsJsonMode: true,
        priority: 4,
    },
    {
        id: 'gemini-3.1-pro',
        displayName: 'Gemini 3.1 Pro',
        supportsJsonMode: true,
        priority: 5,
    },
    {
        id: 'gemma-4-26b-a4b-it',
        displayName: 'Gemma 4 26B',
        supportsJsonMode: false,
        priority: 6,
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
