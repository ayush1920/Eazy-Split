// Disable SSL verification for corporate proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import ocrRoutes from './routes/ocr';
import modelRoutes from './routes/models';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/ocr', ocrRoutes);
app.use('/api/models', modelRoutes);

app.get('/', (req, res) => {
    res.send('Receipt Splitter API is running');
});

// Export app for Vercel
export default app;

// Only listen if not running on Vercel (or similar serverless env)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
