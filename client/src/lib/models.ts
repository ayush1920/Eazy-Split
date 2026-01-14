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

const API_URL = 'http://localhost:3000/api/models';

export async function fetchAvailableModels(): Promise<ModelConfig[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.models;
}

export async function fetchCurrentPreferences(): Promise<ModelPreferences> {
    const response = await fetch(`${API_URL}/current`);
    if (!response.ok) throw new Error('Failed to fetch preferences');
    return response.json();
}

export async function updateModelPreference(model?: string, autoMode?: boolean): Promise<ModelPreferences> {
    const response = await fetch(`${API_URL}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, autoMode }),
    });
    if (!response.ok) throw new Error('Failed to update preference');
    return response.json();
}
