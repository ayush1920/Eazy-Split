
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log("Checking API Key...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ GEMINI_API_KEY is missing in .env");
        return;
    }
    console.log(`✅ Key found (Length: ${key.length})`);

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        console.log("Sending test prompt...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("✅ Response received:", response.text());
    } catch (error: any) {
        console.error("❌ API Call Failed:", error.message);
        if (error.response) {
            console.error("Details:", JSON.stringify(error.response, null, 2));
        }
    }
}

test();
