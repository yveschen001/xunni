
// Use Web Crypto API (SubtleCrypto) - Native to Cloudflare Workers
// No 'node:crypto' dependency needed.

export async function verifySignature(
  apiSecret: string,
  body: object,
  timestamp: string | null,
  nonce: string | null,
  signature: string | null
): Promise<boolean> {
  if (!timestamp || !nonce || !signature) {
    return false;
  }

  // 1. Check Timestamp (prevent replay attacks, e.g., 5 minutes window)
  const now = Math.floor(Date.now() / 1000);
  const reqTime = parseInt(timestamp, 10);
  if (isNaN(reqTime) || Math.abs(now - reqTime) > 300) {
    console.warn('[Security] Invalid timestamp:', { now, reqTime });
    return false;
  }

  // 2. Generate Expected Signature
  // Payload = JSON.stringify(body) + timestamp + (nonce || "")
  // For GET requests, body is usually empty object {}
  const payload = JSON.stringify(body) + timestamp + nonce;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const msgData = encoder.encode(payload);

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, msgData);
    
    // Convert ArrayBuffer to Hex String
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Compare
    return signature === expectedSignature;
  } catch (e) {
    console.error('[Security] Signature verification failed:', e);
    return false;
  }
}
