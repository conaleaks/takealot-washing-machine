<?php
/**
 * E-mail Pós-Compra: Oferta Transparente de Upgrade para Frete Expresso (Priority Dispatch)
 */

function getGreenSendApiKey() {
    $apiKey = getenv('GREEN_SEND_API_KEY');
    if (empty($apiKey) && file_exists(__DIR__ . '/../.env')) {
        $envLines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($envLines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                if (trim($k) === 'GREEN_SEND_API_KEY') return trim($v);
            }
        }
    }
    return $apiKey ?: "";
}

function sendPriorityUpgradeEmail($order) {
    $apiKey = getGreenSendApiKey();
    $toEmail = $order['email'] ?? $order['customer_email'] ?? '';
    if (empty($toEmail) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) return false;

    $name = $order['name'] ?? $order['customer_name'] ?? 'Valued Customer';
    $orderId = $order['order_id'] ?? 'TAK-75-343042';
    $productTitle = $order['product_title'] ?? 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
    $is75 = (strpos($productTitle, '75') !== false);
    $productImage = $order['product_image'] ?? ($is75 ? 'https://iili.io/oKD3ZQa.jpg' : 'https://iili.io/oKD3ZQa.jpg');
    
    $upgradeUrl = "http://localhost:3015/upgrade-shipping.html?order={$orderId}&email=" . urlencode($toEmail);
    $trackUrl = "http://localhost:3015/track.html?order={$orderId}";
    $logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png";

    $subject = "Speed up your delivery: Upgrade to Express Priority Dispatch for order #{$orderId}! ⚡";

    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$subject}</title>
<style>
  body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333333; }
  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e1e4e8; }
  .email-header { background-color: #ffffff; padding: 26px 20px; text-align: center; border-bottom: 2px solid #0b56a4; }
  .email-logo { display: block; margin: 0 auto; max-width: 190px; height: auto; }
  .email-content { padding: 32px 26px; }
  .urgency-badge { display: inline-block; background-color: #eff6ff; color: #0b56a4; border: 1px solid #bfdbfe; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-bottom: 18px; letter-spacing: 0.3px; }
  .greeting { font-size: 20px; font-weight: 800; color: #0b56a4; margin-top: 0; margin-bottom: 12px; }
  .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 22px 0; }
  .feature-row { display: flex; align-items: flex-start; margin-bottom: 12px; font-size: 13.5px; line-height: 1.4; color: #334155; }
  .cta-btn { display: block; text-align: center; background-color: #007733; color: #ffffff !important; text-decoration: none; padding: 16px 24px; border-radius: 6px; font-size: 16px; font-weight: 800; margin: 26px 0 12px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(0, 119, 51, 0.25); }
  .email-footer { background-color: #f1f5f9; padding: 22px; text-align: center; font-size: 11.5px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="email-container">
  <div class="email-header">
    <img src="{$logoUrl}" alt="takealot.com" class="email-logo" width="190" />
  </div>

  <div class="email-content">
    <div class="urgency-badge">⚡ FAST-TRACK YOUR ORDER &bull; OPTIONAL UPGRADE</div>
    <h2 class="greeting">Hi {$name},</h2>
    
    <p style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">
      Your Samsung 9kg Washing Machine is currently being prepared at our Cape Town Distribution Centre!
    </p>
    
    <p style="font-size: 14px; line-height: 1.6; color: #4a5568; margin-top: 0;">
      Your order <strong>#{$orderId}</strong> is confirmed and scheduled for Standard Delivery (estimated 3 - 5 business days).<br><br>
      <strong>Want to receive your Washing Machine even faster?</strong><br>
      Before our daily shipping cutoff, you can optionally upgrade to <strong>Express Priority Dispatch for only R 99</strong>.
    </p>

    <!-- UPGRADE BENEFITS CARD -->
    <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">What You Get with Express Priority Dispatch</div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #1e293b;">
        <tr>
          <td style="padding: 6px 0; width: 24px; vertical-align: top; color: #15803d; font-weight: 900;">✓</td>
          <td style="padding: 6px 0; vertical-align: top;"><strong>Priority Warehouse Queue:</strong> Order moves ahead in our warehouse and dispatches within 12 - 24 hours.</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; width: 24px; vertical-align: top; color: #15803d; font-weight: 900;">✓</td>
          <td style="padding: 6px 0; vertical-align: top;"><strong>Dedicated Express Courier:</strong> Shipped via direct Takealot Express van fleet.</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; width: 24px; vertical-align: top; color: #15803d; font-weight: 900;">✓</td>
          <td style="padding: 6px 0; vertical-align: top;"><strong>Delivery in 24 - 48 Hours:</strong> Get your Washing Machine unboxed and installed days sooner.</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; width: 24px; vertical-align: top; color: #15803d; font-weight: 900;">✓</td>
          <td style="padding: 6px 0; vertical-align: top;"><strong>Live Driver SMS Updates:</strong> Direct phone &amp; SMS tracking with the driver.</td>
        </tr>
      </table>

      <div style="margin-top: 14px; text-align: center; border-top: 1px solid #bbf7d0; padding-top: 10px;">
        <span style="font-size: 12px; color: #166534; font-weight: 700;">ONE-TIME UPGRADE:</span>
        <span style="font-size: 24px; font-weight: 900; color: #15803d; margin-left: 6px;">R 99</span>
      </div>
    </div>

    <!-- ITEM PREVIEW -->
    <div class="info-box">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 80px; vertical-align: top; padding-right: 14px;">
            <img src="{$productImage}" alt="Samsung 9kg Washing Machine" width="76" height="76" style="display: block; width: 76px; height: 76px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #ffffff; padding: 3px;" />
          </td>
          <td style="vertical-align: top;">
            <div style="font-size: 13.5px; font-weight: 700; color: #1a202c;">{$productTitle}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Order #{$orderId} &bull; Preparation Status: In Queue</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA BUTTON -->
    <a href="{$upgradeUrl}" class="cta-btn" target="_blank">
      Upgrade to Express Priority (R 99) &rarr;
    </a>

    <p style="font-size: 12.5px; color: #718096; text-align: center; margin: 14px 0 0; line-height: 1.5;">
      <em>Note: If you are happy with Standard Delivery (3-5 business days), no action is required! Your order will arrive as scheduled.</em>
    </p>

    <div style="text-align: center; margin-top: 18px;">
      <a href="{$trackUrl}" style="color: #0b56a4; font-size: 13px; font-weight: 700; text-decoration: underline;">
        View Live Tracking for Order #{$orderId}
      </a>
    </div>
  </div>

  <div class="email-footer">
    &copy; 2026 Takealot Online (Pty) Ltd. 12th Floor, Takealot Building, 10 Rua Vasco Da Gama Plain, Foreshore, Cape Town, 8001.<br>
    All rights reserved. Customer Support: <a href="mailto:support@takealot.co.za" style="color: #0b56a4; text-decoration: none;">support@takealot.co.za</a>
  </div>
</div>
</body>
</html>
HTML;

    $textBody = "Hi {$name},\n\nYour order #{$orderId} for the {$productTitle} is currently confirmed and scheduled for Standard Delivery (3-5 business days).\n\nWant it faster? Upgrade to Express Priority Dispatch for R 99 to receive delivery in 24 - 48 hours.\n\nUpgrade here:\n{$upgradeUrl}\n\nTrack your order:\n{$trackUrl}\n\nTakealot Support: support@takealot.co.za";

    $payload = [
        "idempotency_key" => "tak-priority-upgrade-" . md5($orderId . time()),
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
            "email_type" => "shipping_upgrade",
            "order_id" => (string)$orderId,
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

    return ($httpCode === 200 || $httpCode === 202);
}
