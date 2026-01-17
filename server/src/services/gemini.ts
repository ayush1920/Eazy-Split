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

  const COMMON_INSTRUCTIONS = `
    Extract the following information in JSON format:
    1. Items (name, price, quantity). Strictly numbers for price.
    2. Other charges (name and amount) like handling charge, platform fees, taxes, delivery charges, packaging charges, etc.
    3. Total Amount
    4. Currency (default INR)

    --------------------------------------------------------
    CRITICAL: MATHEMATICAL CONSISTENCY & ROUNDING LOGIC
    --------------------------------------------------------
    You must ensure the extracted numbers are mathematically consistent.

    1. **Calculate the Sum:**
       Sum = (Sum of all Item Prices * Quantity) + (Sum of all Other Charges).

    2. **Compare with Printed Total:**
       Check if Calculated Sum == Printed Total.

    3. **HANDLE ROUND OFF / ADJUSTMENTS:**
       - "Round Off" or "Rounding" items are frequently SUBTRACTED even if they appear as positive numbers (e.g., 0.01).
       - IF (Calculated Sum > Printed Total) AND (Calculated Sum - Printed Total matches the Round Off amount):
         -> YOU MUST RETURN THE ROUND OFF AMOUNT AS NEGATIVE (e.g., -0.01).
       - IF (Calculated Sum < Printed Total):
         -> The Round Off is likely positive.

    4. **Handle Discounts:**
       - Any item labeled "Discount", "Savings", or appearing in parentheses "(...)" is NEGATIVE.
       - Ensure you extract it as a negative number.

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

  const IMAGE_PROMPT = `
    Analyze this receipt image. Use OCR to extract text and identify values.
    ${COMMON_INSTRUCTIONS}
  `;

  const PDF_PROMPT = `
    Analyze this PDF voucher. This is a digital document with structured data (likely columns for Item Name, Qty, Rate, Amount).
    - Rely on the column structure to accurately identify line items and prices.
    - Do not confuse unit price with total price; extract the total price for the line item if possible, or (price * quantity).
    - Look for "Grand Total" or "Net Payable" as the Total Amount.
    ${COMMON_INSTRUCTIONS}
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