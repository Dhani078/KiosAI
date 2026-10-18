#!/usr/bin/env node
/**
 * Test Dynamic QRIS Generation & EMVCo Checksums
 * Run: node scripts/test-qris-generator.mjs
 */
import { generateDynamicQris, calculateCRC16, getQrisRenderUrl, DEFAULT_DANA_QRIS_STATIC } from "../lib/qris.ts";

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

console.log("=== Testing EMVCo Dynamic QRIS Generator ===");

// 1. Static base CRC check
const baseWithoutCrc = DEFAULT_DANA_QRIS_STATIC.slice(0, -4);
const expectedCrc = DEFAULT_DANA_QRIS_STATIC.slice(-4);
check("validates static DANA QRIS CRC16 (6489)", calculateCRC16(baseWithoutCrc) === expectedCrc);

// 2. Dynamic generation with nominal
const dyn25k = generateDynamicQris(25143);
check("replaces initiation method to dynamic (010212)", dyn25k.includes("010212"));
check("contains tag 54 with exact amount 25143", dyn25k.includes("540525143"));
check("recalculates valid dynamic CRC16", calculateCRC16(dyn25k.slice(0, -4)) === dyn25k.slice(-4));
check("preserves merchant name 'Dhani'", dyn25k.includes("5905Dhani"));
check("preserves NMID 'ID1026500560192'", dyn25k.includes("ID1026500560192"));

// 3. Render URL
const url = getQrisRenderUrl(dyn25k, 250);
check("generates valid QR server image URL", url.startsWith("https://api.qrserver.com") && url.includes(encodeURIComponent(dyn25k)));

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
