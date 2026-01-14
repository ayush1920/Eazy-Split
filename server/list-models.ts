import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ GEMINI_API_KEY is missing in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);

    try {
        console.log("Listing available models...");
        // The listModels method might vary depending on SDK version
        // In @google/generative-ai, we might need to use the REST API directly or check if listModels exists
        // However, we can try to find it in the client or use a known list
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log("✅ Gemma models found:");
            data.models.filter((m: any) => m.name.toLowerCase().includes("gemma")).forEach((m: any) => {
                console.log(`- ${m.name} (${m.displayName})`);
            });
            console.log("\n✅ All models (first 10):");
            data.models.slice(0, 10).forEach((m: any) => {
                console.log(`- ${m.name}`);
            });
        } else {
            console.log("❌ No models returned or error in response:", data);
        }
    } catch (error: any) {
        console.error("❌ Failed to list models:", error.message);
    }
}

listModels();
