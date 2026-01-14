export interface ModelConfig {
    id: string;
    displayName: string;
    supportsJsonMode: boolean;
    priority: number;
}

export interface ModelPreferences {
    selectedModel: string;
    autoMode: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
const API_URL = `${API_BASE_URL}/api/models`;

export async function fetchAvailableModels(): Promise<ModelConfig[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.models;
}


