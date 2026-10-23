import crypto from "crypto";

export const DOKU_API_HOST = process.env.DOKU_API_HOST || "https://api.doku.com";
export const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || "BRN-0225-1792293648186";
export const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || "SK-RoqScR01WHOTA5jgxqHz";
export const DOKU_API_KEY = process.env.DOKU_API_KEY || "doku_key_a74478f357344dd28fb7e592abfacd03";
export const DOKU_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Asq8WUrIOkiAXAqp63MptLY55n+P+CPzBQGsmterYS//yqSLBf2rwvSDVUutkV+34xXIpnQ5jlh0MDNK69KgIDUxqMXWmcTH//1LI1cXTvv/HLxaCdKrh6CCWAD6seQdT1Fzk7ep1LQsnVzvanK2nJOWmYqZFcw/fI3g5mZ128zY7B+thHAskr4zbCMM09TZYNbIvT/zQYFw4nuNoGz1YgPOjjOO44HfRFIvQ0YBZ1kWqW/FZIe6ybDVBNKlr/FsNJ2/Nli6rdIHbzaSAHuuhKTc0zarpIPZ5A46oD6GvIzdRm00Akuk1u9X1Qs/AKXO8xYJsi5JzBEjnDl5NcftwIDAQAB
-----END PUBLIC KEY-----`;

export interface DokuOrderParams {
  orderId: string;
  amountIdr: number;
  callbackUrl?: string;
  resultUrl?: string;
}

export function generateDokuHeaders(targetPath: string, jsonBody: string) {
  const requestId = crypto.randomUUID();
  const requestTimestamp = new Date().toISOString().slice(0, 19) + "Z";
  const digest = crypto.createHash("sha256").update(jsonBody).digest("base64");

  const signatureComponents = [
    `Client-Id:${DOKU_CLIENT_ID}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${targetPath}`,
    `Digest:${digest}`,
  ].join("\n");

  const signature =
    "HMACSHA256=" +
    crypto.createHmac("sha256", DOKU_SECRET_KEY).update(signatureComponents).digest("base64");

  return {
    "Client-Id": DOKU_CLIENT_ID,
    "Request-Id": requestId,
    "Request-Timestamp": requestTimestamp,
    Signature: signature,
    "Content-Type": "application/json",
  };
}

export async function createDokuCheckout(params: DokuOrderParams) {
  const targetPath = "/checkout/v1/payment";
  const body = {
    order: {
      amount: params.amountIdr,
      invoice_number: params.orderId,
      currency: "IDR",
      callback_url: params.callbackUrl || "https://tokoai.my.id/api/webhooks/doku-qris",
      callback_url_result: params.resultUrl || "https://tokoai.my.id/dashboard",
    },
    payment: {
      payment_due_date: 60,
      payment_method_types: ["QRIS"],
    },
  };

  const jsonBody = JSON.stringify(body);
  const headers = generateDokuHeaders(targetPath, jsonBody);

  try {
    const res = await fetch(`${DOKU_API_HOST}${targetPath}`, {
      method: "POST",
      headers,
      body: jsonBody,
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.response?.payment?.url) {
      return {
        success: true,
        paymentUrl: data.response.payment.url as string,
        dokuActive: true,
      };
    }

    return {
      success: false,
      error: data?.message?.[0] || data?.error?.message || "DOKU Channel Pending",
      dokuActive: false,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      dokuActive: false,
    };
  }
}

export function verifyDokuNotification(
  arg1: string | { clientId: string; requestId: string; requestTimestamp: string; signature: string; body: string; targetPath?: string },
  arg2?: Headers,
  arg3 = "/api/payment/webhook"
): boolean {
  let clientId = "";
  let requestId = "";
  let requestTimestamp = "";
  let signature = "";
  let body = "";
  let targetPath = "/api/webhooks/doku-qris";

  if (typeof arg1 === "object" && arg1 !== null) {
    clientId = arg1.clientId;
    requestId = arg1.requestId;
    requestTimestamp = arg1.requestTimestamp;
    signature = arg1.signature;
    body = arg1.body;
    if (arg1.targetPath) targetPath = arg1.targetPath;
  } else if (typeof arg1 === "string" && arg2) {
    body = arg1;
    clientId = arg2.get("client-id") || "";
    requestId = arg2.get("request-id") || "";
    requestTimestamp = arg2.get("request-timestamp") || "";
    signature = arg2.get("signature") || "";
    targetPath = arg3;
  }

  if (!clientId || !requestId || !requestTimestamp || !signature) {
    return false;
  }

  if (clientId !== DOKU_CLIENT_ID) {
    return false;
  }

  const digest = crypto.createHash("sha256").update(body).digest("base64");
  const signatureComponents = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${targetPath}`,
    `Digest:${digest}`,
  ].join("\n");

  const expectedSignature =
    "HMACSHA256=" +
    crypto.createHmac("sha256", DOKU_SECRET_KEY).update(signatureComponents).digest("base64");

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
