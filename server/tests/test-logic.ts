
import { sanitizeParsedData } from '../src/services/gemini';
import assert from 'assert';

console.log("Running Logic Verification Tests...");

// Test 1: Regex Safety (Coffee vs Discount)
console.log("Test 1: Regex Safety...");
const inputRegex = {
  items: [
    { name: "Cold Coffee", price: 5.00, quantity: 1 },
    { name: "Discount", price: 2.00, quantity: 1 }, // Should become -2.00
    { name: "10% off", price: 1.00, quantity: 1 },  // Should become -1.00
    { name: "Toffees", price: 3.00, quantity: 1 }   // Should remain positive
  ],
  other_charges: [],
  total: 5.00
};

const resultRegex = sanitizeParsedData(inputRegex);

// Check Coffee (should be positive)
assert.strictEqual(resultRegex.items[0].price, 5.00, "Coffee should remain positive");

// Check Discount (should be negative)
assert.strictEqual(resultRegex.items[1].price, -2.00, "Discount should be negative");

// Check 'off' (should be negative)
assert.strictEqual(resultRegex.items[2].price, -1.00, "10% off should be negative");

// Check Toffees (should be positive, contains 'off' but not as whole word)
assert.strictEqual(resultRegex.items[3].price, 3.00, "Toffees should remain positive (boundary check)");

console.log("✅ Regex Safety Passed");


// Test 2: Round Off Logic (Residual Calculation)
console.log("Test 2: Round Off Logic...");

// Scenario: Total 100, Items 100.05. Round off should be -0.05.
const inputRoundOff = {
  items: [
    { name: "Item 1", price: 50.05, quantity: 1 },
    { name: "Item 2", price: 50.00, quantity: 1 },
  ],
  other_charges: [
     { name: "Round Off", amount: 0.05 } // Initially positive OCR error
  ],
  total: 100.00
};

const resultRoundOff = sanitizeParsedData(inputRoundOff);
// Expected: 100 - (50.05 + 50.00) = -0.05
assert.strictEqual(resultRoundOff.other_charges[0].amount, -0.05, "Round Off should be corrected to -0.05");

console.log("✅ Round Off Logic Passed");

// Test 3: Round Off Logic (Positive Adjustment)
// Scenario: Total 100, Items 99.95. Round off should be +0.05.
const inputRoundOffPos = {
  items: [
    { name: "Item 1", price: 49.95, quantity: 1 },
    { name: "Item 2", price: 50.00, quantity: 1 },
  ],
  other_charges: [
     { name: "Round Off", amount: 0.05 }
  ],
  total: 100.00
};

const resultRoundOffPos = sanitizeParsedData(inputRoundOffPos);
assert.strictEqual(resultRoundOffPos.other_charges[0].amount, 0.05, "Round Off should remain 0.05");

console.log("✅ Round Off Positive Logic Passed");

console.log("🎉 All Tests Passed!");
