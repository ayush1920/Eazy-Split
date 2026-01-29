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

    3. **HANDLE ROUND OFF / ADJUSTMENTS (Equation Balancing):**
       - The "Round Off" or "Rounding" item is the balancing variable.
       - You MUST ensure that: (Sum of all Item Prices * Quantity) + (Sum of all Other Charges) + (Round Off) = Total Amount.
       - If the numbers don't add up, adjust the SIGN (positive or negative) of the Round Off item to make the equation true.
       - Example: If Sum is 100.05 and Total is 100.00, the Round Off MUST be -0.05.

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
    let parsedData = JSON.parse(jsonStr);

    // Apply rigorous mathematical sanitization
    parsedData = sanitizeParsedData(parsedData);

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

// Use regex with word boundaries to avoid false positives (e.g. "Coffee" matching "off")
// Optimization: Moved to module scope to prevent re-compilation on every function call
const DISCOUNT_REGEX = /\b(discount|savings?|coupon|promo|off|less)\b/i;
const ROUND_OFF_KEYWORDS = ['round off', 'rounding', 'roundoff', 'adjustment'];

/**
 * rigorously validates and corrects the parsed receipt data.
 * - Enforces negative signs for discounts.
 * - Mathematically determines if "Round Off" should be negative based on the Total.
 */
export function sanitizeParsedData(data: any): any {
  // Helper to ensure we have a number
  const getVal = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
    return 0;
  };

  // 1. First Pass: Enforce Negative Signs on explicit Discounts
  const enforceNegatives = (list: any[]) => {
    if (!Array.isArray(list)) return;
    list.forEach(item => {
      const name = (item.name || '');
      // Check if it's a discount, but IGNORE "Round Off" which might contain "off"
      const isRoundOff = ROUND_OFF_KEYWORDS.some(k => name.toLowerCase().includes(k));

      if (DISCOUNT_REGEX.test(name) && !isRoundOff) {
        // If price/amount is positive, flip it
        if (item.price !== undefined && getVal(item.price) > 0) item.price = -getVal(item.price);
        if (item.amount !== undefined && getVal(item.amount) > 0) item.amount = -getVal(item.amount);
      }
    });
  };

  enforceNegatives(data.items);
  enforceNegatives(data.other_charges);

  // 2. Mathematical Verification for Round Off
  // We calculate the sum of all items (excluding Round Off) and determine the exact residual needed to match Total.

  const total = getVal(data.total);
  // If total is 0 or missing, we can't verify math.
  if (total === 0) return data;

  let sumExcludingRoundOff = 0;
  let roundOffItem: any = null;

  // Helper to sum list
  const sumList = (list: any[]) => {
    if (!Array.isArray(list)) return;
    list.forEach(item => {
      const name = (item.name || '').toLowerCase();
      const isRoundOff = ROUND_OFF_KEYWORDS.some(k => name.includes(k));
      const val = getVal(item.price !== undefined ? item.price : item.amount);
      const qty = getVal(item.quantity) || 1;

      if (isRoundOff) {
        roundOffItem = item;
      } else {
        sumExcludingRoundOff += (val * qty);
      }
    });
  };

  sumList(data.items);
  sumList(data.other_charges);

  // If no round off item found, we can't adjust it.
  if (!roundOffItem) return data;

  // Calculate what the Round Off SHOULD be to make the math perfect
  // Total = SumOthers + RoundOff
  // RoundOff = Total - SumOthers
  const expectedRoundOff = total - sumExcludingRoundOff;

  // Safety: Only apply correction if the adjustment is small (e.g. < 1.0 unit).
  // If the discrepancy is large, it's likely a missing item, not a round off error.
  if (Math.abs(expectedRoundOff) < 1.0) {
    // We allow a small epsilon for floating point matches, but generally we force the exact residual.
    // This handles +0.01, -0.01, and 0.00 cases.

    const currentVal = getVal(roundOffItem.price !== undefined ? roundOffItem.price : roundOffItem.amount);

    // Only update if there's a meaningful difference (ignore tiny float noise)
    if (Math.abs(currentVal - expectedRoundOff) > 0.001) {
      console.log(`Auto-Correcting Round Off: Changed ${currentVal} to ${expectedRoundOff.toFixed(2)} to match Total ${total}`);
      if (roundOffItem.price !== undefined) roundOffItem.price = Number(expectedRoundOff.toFixed(2));
      if (roundOffItem.amount !== undefined) roundOffItem.amount = Number(expectedRoundOff.toFixed(2));
    }
  }

  return data;
}