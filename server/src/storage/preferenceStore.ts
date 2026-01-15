import { promises as fs } from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(__dirname, '../storage');
const PREFERENCES_FILE = path.join(STORAGE_DIR, 'preferences.json');

interface Preferences {
    selectedModel?: string;
    autoMode?: boolean;
}

async function ensureStorageDir(): Promise<void> {
    try {
        await fs.stat(STORAGE_DIR);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Creating storage directory:', STORAGE_DIR);
            await fs.mkdir(STORAGE_DIR, { recursive: true });
        } else {
            console.error('Failed to check or create storage directory:', error);
            throw error;
        }
    }
}

export async function getPreferences(): Promise<Preferences> {
    try {
        await ensureStorageDir();
        const data = await fs.readFile(PREFERENCES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            console.error('Error reading preferences:', error);
        }
    }

    return { autoMode: true }; // Default to auto mode
}

export async function savePreferences(preferences: Preferences): Promise<void> {
    try {
        await ensureStorageDir();
        console.log('Saving preferences:', preferences);
        await fs.writeFile(PREFERENCES_FILE, JSON.stringify(preferences, null, 2));
        console.log('Preferences saved successfully to:', PREFERENCES_FILE);
    } catch (error) {
        console.error('Error saving preferences:', error);
        throw new Error(`Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
