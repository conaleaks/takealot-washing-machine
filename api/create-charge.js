/**
 * Serverless Handler para GhoPay.app (Node.js / Vercel / Netlify)
 * Documentação: https://ghopay.app/docs#inicio
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GHOST_API_KEY || "";

  try {
    const ghoResponse = await fetch("https://ghopay.app/api/v1/charges", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `tak-${Date.now()}`
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    });

    const data = await ghoResponse.json();
    return res.status(ghoResponse.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "GhoPay request failed" });
  }
}
