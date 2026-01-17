import type { ReceiptGroup } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
const API_URL = `${API_BASE_URL}/api/ocr`;

export async function uploadReceipt(file: File, selectedModel?: string, autoMode: boolean = true): Promise<ReceiptGroup & { _modelUsed?: string }> {
    const formData = new FormData();
    formData.append('autoMode', String(autoMode));

    // Add model preference if specified
    if (selectedModel) {
        formData.append('model', selectedModel);
    }

    // Append file last to ensure text fields are parsed first by Multer
    formData.append('image', file);

    const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload receipt');
    }

    const data = await response.json();

    const items = (data.items || []).map((item: any) => ({
        id: uuidv4(),
        name: item.name || 'Unnamed Item',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        sourceImageId: 'generated'
    }));

    // Add other charges as items so they can be split
    if (data.other_charges && Array.isArray(data.other_charges)) {
        data.other_charges.forEach((charge: any) => {
            items.push({
                id: uuidv4(),
                name: charge.name || 'Unnamed Charge',
                price: typeof charge.amount === 'number' ? charge.amount : parseFloat(charge.amount) || 0,
                sourceImageId: 'generated'
            });
        });
    }

    // Transform data to match ReceiptGroup
    return {
        id: uuidv4(),
        platform: 'Zepto', // Default to Zepto
        date: new Date().toISOString().split('T')[0], // Default to current date
        currency: data.currency || 'INR',
        items: items,
        tax: 0,
        tip: 0,
        _modelUsed: data._modelUsed,
    };
}
