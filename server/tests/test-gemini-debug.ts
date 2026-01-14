
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

// Fix TLS again for the test script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
    const key = process.env.GEMINI_API_KEY || "";
    console.log("Using Key:", key.substring(0, 5) + "...");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    try {
        console.log("Attempting to connect to Gemini...");
        const result = await model.generateContent("test");
        console.log("Success:", await result.response.text());
    } catch (error: any) {
        console.error("Gemini Error:", error.message);
        if (error.response) {
            console.error("Gemini Response:", JSON.stringify(error.response, null, 2));
        }

        // Manual Fetch Debug for 403
        try {
            console.log("\nAttempting raw fetch...");
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "test" }] }] })
            });
            console.log("Status:", res.status);
            console.log("Body:", await res.text());
        } catch (e: any) {
            console.error("Fetch failed:", e.message);
        }
    }
}

test();
