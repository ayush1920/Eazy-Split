import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ModelQuota {
    modelId: string;
    available: boolean;
    error?: string;
    details?: {
        rpm?: { limit: number; usage: number };
        tpm?: { limit: number; usage: number };
        rpd?: { limit: number; usage: number };
    };
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function checkModelQuota(modelId: string): Promise<ModelQuota> {
    try {
        // Fetch model metadata which includes quota information
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}?key=${process.env.GEMINI_API_KEY}`
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                modelId,
                available: false,
                error: errorData.error?.message || `HTTP ${response.status}`,
            };
        }

        const modelData = await response.json();

        // Extract quota information if available
        // Note: The actual structure depends on the API response
        // This is a best-effort extraction
        const quotaInfo = modelData.quotaInfo || {};

        return {
            modelId,
            available: true,
            details: {
                rpm: quotaInfo.requestsPerMinute ? {
                    limit: quotaInfo.requestsPerMinute.limit || 0,
                    usage: quotaInfo.requestsPerMinute.usage || 0,
                } : undefined,
                tpm: quotaInfo.tokensPerMinute ? {
                    limit: quotaInfo.tokensPerMinute.limit || 0,
                    usage: quotaInfo.tokensPerMinute.usage || 0,
                } : undefined,
                rpd: quotaInfo.requestsPerDay ? {
                    limit: quotaInfo.requestsPerDay.limit || 0,
                    usage: quotaInfo.requestsPerDay.usage || 0,
                } : undefined,
            },
        };
    } catch (error: any) {
        return {
            modelId,
            available: false,
            error: error.message || 'Unknown error',
        };
    }
}

export async function checkAllModelsQuota(modelIds: string[]): Promise<ModelQuota[]> {
    const quotaChecks = modelIds.map(id => checkModelQuota(id));
    return Promise.all(quotaChecks);
}
