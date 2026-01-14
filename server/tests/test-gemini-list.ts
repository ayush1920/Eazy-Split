
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function listModels() {
    const key = process.env.GEMINI_API_KEY || "";
    console.log("Using Key:", key.substring(0, 5) + "...");

    try {
        console.log("Listing models via raw fetch...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url);
        console.log("Status:", res.status);
        const data = await res.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

listModels();
