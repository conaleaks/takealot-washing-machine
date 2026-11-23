export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GREEN_SEND_API_KEY || "";
  if (!apiKey) {
    return res.status(500).json({ error: 'GreenSend API key not configured' });
  }

  try {
    const order = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const toEmail = order.email || order.customer_email;
    if (!toEmail || !toEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid recipient email' });
    }

    const host = req.headers.host || "takealot.co.za";
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    const orderId = order.order_id || order.orderId || `TAK-${Math.floor(100000 + Math.random() * 900000)}`;
    const name = order.name || order.customer_name || 'Valued Customer';
    const amount = order.amount || 1199;
    const qty = order.quantity || 1;
    const address = order.address || order.delivery_address || 'Delivery Address Provided';
    const productTitle = order.product_title || order.title || 'Takealot Order';
    
    let productImage = order.product_image || order.image || '';
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

    const greenSendResp = await fetch("https://greensend.app/v1/messages", {
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

    const data = await greenSendResp.json();
    return res.status(greenSendResp.status).json({ success: greenSendResp.ok, data });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
