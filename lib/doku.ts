import crypto from "crypto";

export const DOKU_API_HOST = process.env.DOKU_API_HOST || "https://api.doku.com";
export const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || "BRN-0225-1792293648186";
export const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || "SK-RoqScR01WHOTA5jgxqHz";

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
      callback_url: params.callbackUrl || "https://tokoai.my.id/api/payment/webhook",
      callback_url_result: params.resultUrl || "https://tokoai.my.id/dashboard",
    },
    payment: {
      payment_due_date: 60,
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

export function verifyDokuNotification(rawBody: string, headers: Headers, targetPath = "/api/payment/webhook"): boolean {
  const clientId = headers.get("client-id");
  const requestId = headers.get("request-id");
  const requestTimestamp = headers.get("request-timestamp");
  const incomingSignature = headers.get("signature") || "";

  if (!clientId || !requestId || !requestTimestamp || !incomingSignature) {
    return false;
  }

  if (clientId !== DOKU_CLIENT_ID) {
    return false;
  }

  const digest = crypto.createHash("sha256").update(rawBody).digest("base64");
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
    return crypto.timingSafeEqual(
      Buffer.from(incomingSignature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
