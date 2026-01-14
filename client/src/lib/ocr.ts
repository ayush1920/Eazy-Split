import type { ReceiptGroup } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api/ocr`;

export async function uploadReceipt(file: File, selectedModel?: string): Promise<ReceiptGroup & { _modelUsed?: string }> {
    const formData = new FormData();
    formData.append('image', file);

    // Add model preference if specified
    if (selectedModel) {
        formData.append('model', selectedModel);
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload receipt');
    }

    const data = await response.json();

    // Transform data to match ReceiptGroup
    return {
        id: uuidv4(),
        platform: 'Zepto', // Default to Zepto
        date: new Date().toISOString().split('T')[0], // Default to current date
        currency: data.currency || 'INR',
        items: (data.items || []).map((item: any) => ({
            id: uuidv4(),
            name: item.name || 'Unnamed Item',
            price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
            sourceImageId: 'generated'
        })),
        tax: 0,
        tip: 0,
        _modelUsed: data._modelUsed,
    };
}
