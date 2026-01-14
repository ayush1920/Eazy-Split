import express from 'express';
import multer from 'multer';
import { processReceiptImage } from '../services/gemini';
import { getPreferences } from '../storage/preferenceStore';
import { DEFAULT_MODEL } from '../config/models';
import fs from 'fs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    try {
        // Get model preference from request body or use stored preference
        const requestedModel = req.body.model;
        const preferences = getPreferences();
        const modelToUse = requestedModel || preferences.selectedModel || DEFAULT_MODEL;
        const autoMode = preferences.autoMode ?? true;

        const result = await processReceiptImage(
            req.file.buffer,
            req.file.mimetype,
            modelToUse,
            autoMode // Only attempt fallback if auto mode is enabled
        );

        // Return both the data and the model that was used
        res.json({
            ...result.data,
            _modelUsed: result.modelUsed,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

router.get('/health', (req: any, res: any) => {
    res.send('OCR Service Running');
});

export default router;
