import dotenv from 'dotenv';
dotenv.config();

/**
 * Test script to check actual quota response from Gemini API
 * Run with: npx ts-node test-quota-response.ts
 */

async function testQuotaResponse() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env');
        return;
    }

    const models = [
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemma-3-12b-it',
        'gemma-3-27b-it',
    ];

    console.log('🔍 Testing Gemini API quota responses...\n');

    for (const modelId of models) {
        console.log(`\n📊 Model: ${modelId}`);
        console.log('─'.repeat(60));

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}?key=${apiKey}`;
            const response = await fetch(url);

            console.log(`Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.log('❌ Error:', JSON.stringify(errorData, null, 2));
                continue;
            }

            const data = await response.json();

            // Log the entire response to see structure
            console.log('\n📋 Full Response:');
            console.log(JSON.stringify(data, null, 2));

            // Check for quota-related fields
            console.log('\n🔎 Quota-related fields:');
            if (data.quotaInfo) {
                console.log('✓ quotaInfo:', JSON.stringify(data.quotaInfo, null, 2));
            } else {
                console.log('✗ No quotaInfo field');
            }

            if (data.rateLimit) {
                console.log('✓ rateLimit:', JSON.stringify(data.rateLimit, null, 2));
            } else {
                console.log('✗ No rateLimit field');
            }

            if (data.quota) {
                console.log('✓ quota:', JSON.stringify(data.quota, null, 2));
            } else {
                console.log('✗ No quota field');
            }

            // List all top-level keys
            console.log('\n🗝️  All top-level keys:', Object.keys(data).join(', '));

        } catch (error: any) {
            console.log('❌ Exception:', error.message);
        }
    }

    console.log('\n\n💡 Note: The Gemini API may not expose quota details via the model metadata endpoint.');
    console.log('   Quota information is typically only available through:');
    console.log('   1. Error responses (429 status) when quota is exceeded');
    console.log('   2. Google Cloud Console quota dashboard');
    console.log('   3. Usage tracking in your own application');
}

testQuotaResponse().catch(console.error);
