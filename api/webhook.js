import { createHmac, timingSafeEqual } from "node:crypto";

export const config = {
  api: {
    bodyParser: false, // Necessário para capturar os bytes originais brutos
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.GHOST_WEBHOOK_SECRET || "";
  const signature = req.headers["x-ghost-signature"] || "";

  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return res.status(401).json({ error: "Invalid signature format" });
  }

  try {
    const rawBody = await getRawBody(req);
    const expected = createHmac("sha256", secret).update(rawBody).digest();
    const received = Buffer.from(signature, "hex");

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return res.status(401).json({ error: "Signature mismatch" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    console.log("Ghost Pay Webhook received:", event.event, event.data?.id);

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: err.message });
  }
}
