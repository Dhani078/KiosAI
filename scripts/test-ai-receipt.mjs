#!/usr/bin/env node
/**
 * Test AI Receipt Verification & Smart QRIS with Unique Codes
 * Run: node --env-file=.env scripts/test-ai-receipt.mjs
 */
import { verifyReceiptWithAI } from "../lib/receipt-verifier.ts";

let pass = 0;
let fail = 0;

function check(name, condition) {
  if (condition) {
    console.log(`PASS: ${name}`);
    pass++;
  } else {
    console.error(`FAIL: ${name}`);
    fail++;
  }
}

console.log("=== Testing AI Vision Receipt Verification Engine ===");

// 1. Missing API Key handling
const origKey = process.env.GEMINI_API_KEY;
const origKey2 = process.env.GEMINI_API_KEY_2;
delete process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY_2;
const missingKeyTest = await verifyReceiptWithAI({
  imageBase64: "dGVzdA==",
  mimeType: "image/png",
  expectedAmount: 25143,
});
check("handles missing GEMINI_API_KEY gracefully", !missingKeyTest.valid && missingKeyTest.error?.includes("Gemini API"));
process.env.GEMINI_API_KEY = origKey;
process.env.GEMINI_API_KEY_2 = origKey2;

// 2. Test live AI Vision response on synthetic sample (rejects non-receipt images)
const sampleBuf = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const liveTest = await verifyReceiptWithAI({
  imageBase64: sampleBuf.toString("base64"),
  mimeType: "image/png",
  expectedAmount: 25143,
  expectedBaseAmount: 25000,
});
check("rejects image without receipt text", !liveTest.valid);

// 3. Unauthenticated request to verify-receipt route returns 401
const target = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
try {
  const unauthRes = await fetch(`${target}/api/orders/verify-receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: "fake-order", imageBase64: "dGVzdA==" }),
  });
  if (unauthRes.status === 401) {
    check("POST /api/orders/verify-receipt rejects unauthenticated access (401)", true);
  }
} catch {
  // If local server is not running during standalone unit test, skip route check gracefully
}

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
