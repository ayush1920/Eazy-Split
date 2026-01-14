import { Router } from 'express';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '../config/models';
import { getPreferences, savePreferences } from '../storage/preferenceStore';

const router = Router();

// Get all available models
router.get('/', (req, res) => {
    res.json({ models: AVAILABLE_MODELS });
});

// Get current model preference
router.get('/current', (req, res) => {
    const preferences = getPreferences();
    res.json({
        selectedModel: preferences.selectedModel || DEFAULT_MODEL,
        autoMode: preferences.autoMode ?? true,
    });
});

// Set model preference
router.post('/select', (req, res) => {
    try {
        const { model, autoMode } = req.body;

        if (model && !AVAILABLE_MODELS.find(m => m.id === model)) {
            return res.status(400).json({ error: 'Invalid model ID' });
        }

        const preferences = getPreferences();

        if (model !== undefined) {
            preferences.selectedModel = model;
        }

        if (autoMode !== undefined) {
            preferences.autoMode = autoMode;
        }

        savePreferences(preferences);

        res.json({
            selectedModel: preferences.selectedModel || DEFAULT_MODEL,
            autoMode: preferences.autoMode ?? true,
        });
    } catch (error: any) {
        console.error('Error in /api/models/select:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
