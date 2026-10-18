#!/usr/bin/env node
/**
 * Test DOKU Checkout Integration & Webhook Notification Signature Verification
 * Run: node --env-file=.env scripts/test-doku.mjs
 */
import crypto from "node:crypto";
import { generateDokuHeaders, verifyDokuNotification, DOKU_CLIENT_ID, DOKU_SECRET_KEY } from "../lib/doku.ts";

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

console.log("=== Testing DOKU Checkout & Webhook Integration ===");

// 1. Header & Signature generation
const sampleBody = JSON.stringify({
  order: { amount: 25000, invoice_number: "TEST-INV-1" },
});
const headers = generateDokuHeaders("/checkout/v1/payment", sampleBody);

check("headers contain Client-Id", headers["Client-Id"] === DOKU_CLIENT_ID);
check("headers contain Request-Id", Boolean(headers["Request-Id"]));
check("headers contain Request-Timestamp", Boolean(headers["Request-Timestamp"]));
check("signature format starts with HMACSHA256=", headers.Signature.startsWith("HMACSHA256="));

// 2. Incoming Notification Verification
const notifBody = JSON.stringify({
  service: { id: "QRIS", name: "QRIS" },
  order: { invoice_number: "INV-DOKU-001", amount: 25000 },
  transaction: { status: "SUCCESS", date: "2026-10-18T04:00:00Z" },
});

const reqId = crypto.randomUUID();
const timestamp = new Date().toISOString().slice(0, 19) + "Z";
const digest = crypto.createHash("sha256").update(notifBody).digest("base64");
const sigTarget = "/api/payment/webhook";

const validComponents = [
  `Client-Id:${DOKU_CLIENT_ID}`,
  `Request-Id:${reqId}`,
  `Request-Timestamp:${timestamp}`,
  `Request-Target:${sigTarget}`,
  `Digest:${digest}`,
].join("\n");

const validSignature =
  "HMACSHA256=" +
  crypto.createHmac("sha256", DOKU_SECRET_KEY).update(validComponents).digest("base64");

const mockHeaders = new Headers({
  "client-id": DOKU_CLIENT_ID,
  "request-id": reqId,
  "request-timestamp": timestamp,
  signature: validSignature,
});

check("validates authentic DOKU notification", verifyDokuNotification(notifBody, mockHeaders, sigTarget));

const tamperedHeaders = new Headers({
  "client-id": DOKU_CLIENT_ID,
  "request-id": reqId,
  "request-timestamp": timestamp,
  signature: "HMACSHA256=invalidSignature123",
});
check("rejects tampered DOKU signature", !verifyDokuNotification(notifBody, tamperedHeaders, sigTarget));

const wrongClientHeaders = new Headers({
  "client-id": "MCH-WRONG-CLIENT",
  "request-id": reqId,
  "request-timestamp": timestamp,
  signature: validSignature,
});
check("rejects notification with wrong client id", !verifyDokuNotification(notifBody, wrongClientHeaders, sigTarget));

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
