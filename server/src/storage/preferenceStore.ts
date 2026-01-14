import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(__dirname, '../storage');
const PREFERENCES_FILE = path.join(STORAGE_DIR, 'preferences.json');

interface Preferences {
    selectedModel?: string;
    autoMode?: boolean;
}

function ensureStorageDir() {
    try {
        if (!fs.existsSync(STORAGE_DIR)) {
            console.log('Creating storage directory:', STORAGE_DIR);
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('Failed to create storage directory:', error);
    }
}

export function getPreferences(): Preferences {
    try {
        ensureStorageDir();
        if (fs.existsSync(PREFERENCES_FILE)) {
            const data = fs.readFileSync(PREFERENCES_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading preferences:', error);
    }

    return { autoMode: true }; // Default to auto mode
}

export function savePreferences(preferences: Preferences): void {
    try {
        ensureStorageDir();
        console.log('Saving preferences:', preferences);
        fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(preferences, null, 2));
        console.log('Preferences saved successfully to:', PREFERENCES_FILE);
    } catch (error) {
        console.error('Error saving preferences:', error);
        throw new Error(`Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
