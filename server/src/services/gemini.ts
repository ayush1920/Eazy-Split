import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fs from "fs";
import { getModelConfig, getNextFallbackModel } from '../config/models';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const processReceiptImage = async (
  fileBuffer: Buffer,
  mimeType: string,
  modelId: string = 'gemini-2.0-flash',
  attemptFallback: boolean = true
): Promise<{ data: any; modelUsed: string }> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  console.log("Processing with Gemini...");

  let finalMimeType = mimeType || 'image/jpeg';
  if (mimeType === "application/octet-stream") {
    finalMimeType = 'image/jpeg'; // Fallback
  }

  const modelConfig = getModelConfig(modelId);
  if (!modelConfig) {
    throw new Error(`Invalid model ID: ${modelId}`);
  }

  console.log(`Processing with model: ${modelConfig.displayName} (${modelId})`);

  const model = genAI.getGenerativeModel({
    model: modelId
  });

  // Determine prompt based on file type
  const isPdf = finalMimeType === 'application/pdf';

  const filePart = {
    inlineData: {
      data: fileBuffer.toString("base64"),
      mimeType: finalMimeType,
    },
  };

  const IMAGE_PROMPT = `
    Analyze this receipt image and extract the following information in JSON format:
    1. Items (name and price). strictly numbers for price.
    2. Other charges (name and amount) like handling charge, platform fees, taxes, etc.
    3. Total Amount
    4. Currency (default INR)

    Return ONLY raw JSON with no markdown formatting. Structure:
    {
      "items": [
        { "name": "string", "price": number, "quantity": number }
      ],
      "other_charges": [
        { "name": "string", "amount": number }
      ],
      "total": number,
      "currency": "string"
    }
  `;

  const PDF_PROMPT = `
    Analyze this PDF voucher (likely from Zepto, Blinkit, DMart, Amazon, or similar) and extract the following information in JSON format:
    1. Items (name, price per unit, and quantity). Strictly numbers for price.
    2. Other charges (name and amount) like handling charge, platform fees, taxes, delivery charges, etc.
    3. Total Amount
    4. Currency (default INR)

    The PDF content is structured. Ensure you extract all line items accurately.

    Return ONLY raw JSON with no markdown formatting. Structure:
    {
      "items": [
        { "name": "string", "price": number, "quantity": number }
      ],
      "other_charges": [
        { "name": "string", "amount": number }
      ],
      "total": number,
      "currency": "string"
    }
  `;

  const prompt = isPdf ? PDF_PROMPT : IMAGE_PROMPT;

  // ✅ CHANGE 2: Add Safety Settings so receipts don't get blocked as "PII"
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  try {
    const generationConfig = modelConfig.supportsJsonMode
      ? { responseMimeType: "application/json" }
      : undefined;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [filePart, { text: prompt }] }],
      safetySettings,
      ...(generationConfig && { generationConfig }),
    });

    const response = await result.response;
    const text = response.text();

    console.log("Gemini Raw Response:", text); // Debug log

    // Clean markdown if present
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(jsonStr);

    return {
      data: parsedData,
      modelUsed: modelId,
    };

  } catch (error: any) {
    // ✅ CHANGE 3: Log the ACTUAL error so you can see it in VS Code/Terminal
    console.error("🔥 FULL GEMINI ERROR:", JSON.stringify(error, null, 2));

    // Check for quota issues and attempt fallback
    if (error.status === 429 && attemptFallback) {
      console.warn(`Quota exceeded for ${modelId}, attempting fallback...`);
      const fallbackModel = getNextFallbackModel(modelId);

      if (fallbackModel) {
        console.log(`Falling back to ${fallbackModel.displayName}`);
        return processReceiptImage(fileBuffer, mimeType, fallbackModel.id, true);
      } else {
        throw new Error("Quota exceeded for all available models.");
      }
    }

    throw new Error(`Failed to process receipt: ${error.message}${error.stack ? `\n${error.stack}` : ''}`);
  }
};