import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config();

/**
 * Alternative test: Try to trigger quota errors to see response structure
 * Run with: npx ts-node test-quota-error.ts
 */

async function testQuotaError() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = 'gemini-2.5-flash';

    console.log(`🧪 Testing quota error response for ${modelId}...\n`);

    try {
        const model = genAI.getGenerativeModel({ model: modelId });

        // Make a simple request
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        });

        const response = await result.response;
        const text = response.text();

        console.log('✅ Request successful!');
        console.log('Response:', text);
        console.log('\n📊 Response metadata:');
        console.log(JSON.stringify(response, null, 2));

    } catch (error: any) {
        console.log('❌ Error caught!');
        console.log('\n📋 Full error object:');
        console.log(JSON.stringify(error, null, 2));

        console.log('\n🔍 Error details:');
        console.log('- Status:', error.status);
        console.log('- Message:', error.message);
        console.log('- Stack:', error.stack);

        if (error.response) {
            console.log('\n📡 Response object:');
            console.log(JSON.stringify(error.response, null, 2));
        }
    }

    console.log('\n\n💡 To see quota exceeded errors:');
    console.log('   1. Make many rapid requests to exceed RPM limit');
    console.log('   2. Check Google Cloud Console for quota details');
    console.log('   3. The error will have status 429 with quota information');
}

testQuotaError().catch(console.error);
