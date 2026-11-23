import { createHmac, timingSafeEqual } from "node:crypto";
import crypto from "node:crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
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

async function sendGreenSendConfirmationEmail(order, baseUrl) {
  const apiKey = process.env.GREEN_SEND_API_KEY || "";
  if (!apiKey) return;

  const toEmail = order.email;
  if (!toEmail || !toEmail.includes('@')) return;

  const orderId = order.order_id || `TAK-${Math.floor(100000 + Math.random() * 900000)}`;
  const name = order.name || 'Valued Customer';
  const amount = order.amount || 1199;
  const qty = order.quantity || 1;
  const address = order.address || 'Delivery Address Provided';
  const productTitle = order.product_title || 'Takealot Order';
  
  let productImage = order.product_image || '';
  if (!productImage || productImage.startsWith('/')) {
    productImage = `${baseUrl}/${(productImage || 'imagens/product.png').replace(/^\//, '')}`;
  }

  const trackUrl = `${baseUrl}/track.html?order=${encodeURIComponent(orderId)}`;

  const textBody = `Hi ${name},\n\nThank you for shopping on Takealot.com!\nWe have received your payment of R ${amount} and your order #${orderId} is confirmed.\n\nItem: ${productTitle}\nQuantity: ${qty}\nDelivery to: ${address}\nEstimated delivery: 2-4 business days.\n\nTrack your order: ${trackUrl}\n\nTakealot Support: support@takealot.co.za`;

  const htmlBody = `
    <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;border:1px solid #e1e4e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#333;overflow:hidden;">
      <div style="background:#ffffff;padding:26px 20px;text-align:center;border-bottom:2px solid #0b56a4;">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png" alt="takealot.com" width="190" style="display:block;margin:0 auto;max-width:190px;height:auto;" />
      </div>
      <div style="padding:28px;">
        <div style="display:inline-block;background:#e8f5e9;color:#1e7e34;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:16px;">✓ PAYMENT RECEIVED &amp; CONFIRMED</div>
        <h2 style="color:#0b56a4;margin-top:0;">Hi ${name},</h2>
        <p style="font-size:14px;line-height:1.6;color:#4a5568;">Great news! We've received your payment of <strong>R ${amount}</strong> and your order is now officially being prepared for dispatch.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">Order Summary (#${orderId})</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;border-bottom:1px solid #edf2f7;padding-bottom:12px;">
            <tr>
              <td style="width:84px;vertical-align:top;padding-right:14px;padding-bottom:10px;">
                <img src="${productImage}" alt="${productTitle}" width="80" height="80" style="display:block;width:80px;height:80px;object-fit:contain;border:1px solid #e2e8f0;border-radius:6px;background:#fff;padding:3px;" />
              </td>
              <td style="vertical-align:top;padding-bottom:10px;">
                <div style="font-size:14px;font-weight:700;color:#1a202c;line-height:1.4;">${productTitle}</div>
                <div style="font-size:12.5px;color:#718096;margin-top:4px;">Quantity: ${qty} &bull; Delivery: FREE</div>
                <div style="font-size:14px;font-weight:700;color:#0b56a4;margin-top:6px;">R ${amount}</div>
              </td>
            </tr>
          </table>
          <div style="margin-top:10px;font-size:16px;font-weight:700;color:#0b56a4;">Total Paid: R ${amount}</div>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:14px;margin-bottom:20px;font-size:13.5px;color:#4a5568;">
          <strong>Delivery Address:</strong><br>${name}<br>${address}<br>
          <strong>Estimated Delivery:</strong> 2 - 4 business days
        </div>
        <a href="${trackUrl}" style="display:block;text-align:center;background:#007733;color:#fff;text-decoration:none;padding:14px;border-radius:6px;font-weight:700;font-size:15px;">Track Your Order on Takealot</a>
      </div>
      <div style="background:#f1f5f9;padding:18px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
        &copy; 2026 Takealot Online (Pty) Ltd. Cape Town, South Africa.<br>Questions? Contact support@takealot.co.za
      </div>
    </div>
  `;

  try {
    await fetch("https://greensend.app/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idempotency_key: `tak-order-${orderId}`,
        channel: "email",
        sender_name: "Takealot.com",
        to: toEmail,
        message: {
          subject: `Order Confirmed: #${orderId} - Takealot.com`,
          text: textBody,
          html: htmlBody,
          reply_to: "support@takealot.co.za"
        },
        metadata: {
          order_id: String(orderId),
          store: "takealot",
          amount: String(amount)
        }
      })
    });
  } catch(e) {
    console.error("[GreenSend] Webhook email send error:", e);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.GHOST_WEBHOOK_SECRET || "";
  const signature = req.headers["x-ghost-signature"] || "";

  try {
    const rawBody = await getRawBody(req);
    if (secret && signature && /^[a-f0-9]{64}$/i.test(signature)) {
      const expected = createHmac("sha256", secret).update(rawBody).digest();
      const received = Buffer.from(signature, "hex");
      if (expected.length === received.length && !timingSafeEqual(expected, received)) {
        return res.status(401).json({ error: "Signature mismatch" });
      }
    }

    const host = req.headers.host || "takealot.co.za";
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    const event = JSON.parse(rawBody.toString("utf8") || "{}");
    const evType = event.event || "";
    const evData = event.data || {};

    if (evType === 'charge.completed' || evData.status === 'COMPLETED') {
      const meta = evData.metadata || {};
      const cEmail = (meta.real_email || (evData.customer_email && !evData.customer_email.startsWith('buyer_') ? evData.customer_email : '') || meta.customer_email || '').trim().toLowerCase();
      const orderId = meta.order_id || evData.id || `TAK-${Math.floor(100000 + Math.random() * 900000)}`;

      if (cEmail) {
        await sendGreenSendConfirmationEmail({
          email: cEmail,
          name: meta.recipient_name || 'Customer',
          order_id: orderId,
          amount: evData.amount,
          quantity: meta.quantity || 1,
          address: meta.delivery_address || 'South Africa',
          product_title: meta.product_title || evData.title,
          product_image: meta.product_image
        }, baseUrl);
      }

      await sendMetaCapiEvent('Purchase', {
        ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
        userAgent: req.headers['user-agent'],
        email: cEmail,
        phone: meta.customer_phone || evData.customer_phone,
        name: meta.recipient_name,
        amount: evData.amount,
        title: meta.product_title || evData.title,
        orderId: orderId,
        eventId: orderId,
        fbclid: meta.fbclid,
        sourceUrl: `${baseUrl}/obrigado.html`
      });
    }

    return res.status(200).json({ received: true });
  } catch(err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: err.message });
  }
}
