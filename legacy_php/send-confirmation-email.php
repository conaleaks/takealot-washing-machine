<?php
/**
 * Helper para envio de e-mail de confirmação Takealot via Green Send (greensend.app)
 */

function sendTakealotConfirmationEmail($params) {
    $apiKey = getenv('GREEN_SEND_API_KEY');
    
    // Fallback se não estiver nas vars de ambiente
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

    $orderId = $params['order_id'] ?? ('TAK-' . rand(100000, 999999));
    $name = $params['name'] ?? 'Valued Customer';
    $amount = $params['amount'] ?? 1899;
    $qty = $params['quantity'] ?? 1;
    $address = $params['address'] ?? 'Delivery Address Provided';
    $productTitle = $params['product_title'] ?? 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
    
    // Imagem do produto correspondente à variação (Hospedada no Imgur CDN global)
    $productImage = $params['product_image'] ?? '';
    if (empty($productImage)) {
        if (strpos($productTitle, '75') !== false) {
            $productImage = 'https://iili.io/oKD3ZQa.jpg'; // 75 Polegadas
        } else {
            $productImage = 'https://iili.io/oKD3ZQa.jpg'; // 55 Polegadas
        }
    }

    $subject = "Order Confirmed: #{$orderId} - Takealot.com";

    // Plain text version
    $textBody = "Hi {$name},\n\n"
              . "Thank you for shopping on Takealot.com!\n"
              . "We have received your payment and your order has been confirmed.\n\n"
              . "ORDER DETAILS:\n"
              . "Order Number: #{$orderId}\n"
              . "Item: {$productTitle} (Qty: {$qty})\n"
              . "Total Paid: R {$amount}\n"
              . "Delivery: FREE\n\n"
              . "DELIVERY ADDRESS:\n"
              . "{$name}\n{$address}\n\n"
              . "Estimated Delivery: 2 - 4 Business Days.\n\n"
              . "Thanks,\nThe Takealot Team\nsupport@takealot.co.za";

    // Official Takealot Branded HTML Email
    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Confirmed</title>
<style>
  body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333333; }
  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e1e4e8; }
  .email-header { background-color: #ffffff; padding: 26px 20px; text-align: center; border-bottom: 2px solid #0b56a4; }
  .email-logo { display: block; margin: 0 auto; max-width: 190px; height: auto; }
  .email-content { padding: 32px 28px; }
  .greeting { font-size: 18px; font-weight: 700; color: #0b56a4; margin-top: 0; margin-bottom: 12px; }
  .order-badge { display: inline-block; background-color: #e8f5e9; color: #1e7e34; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
  .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
  .info-row:last-child { border-bottom: none; font-weight: 700; font-size: 16px; color: #0b56a4; }
  .product-summary { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid #edf2f7; }
  .prod-title { font-size: 14px; font-weight: 600; color: #1a202c; }
  .prod-meta { font-size: 13px; color: #718096; margin-top: 4px; }
  .address-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-top: 10px; font-size: 13.5px; line-height: 1.5; color: #4a5568; }
  .cta-btn { display: block; text-align: center; background-color: #007733; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-size: 15px; font-weight: 700; margin: 26px 0 10px; }
  .email-footer { background-color: #f1f5f9; padding: 22px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="email-container">
  <div class="email-header">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Takealot_logo.svg/500px-Takealot_logo.svg.png" alt="takealot.com" class="email-logo" width="190" />
  </div>
  
  <div class="email-content">
    <div class="order-badge">✓ PAYMENT RECEIVED & CONFIRMED</div>
    <h2 class="greeting">Hi {$name},</h2>
    <p style="font-size: 14.5px; line-height: 1.6; color: #4a5568; margin-top: 0;">
      Thank you for your order! We've received your payment of <strong>R {$amount}</strong> via Credit Card and your order is now officially being prepped for dispatch.
    </p>

    <div class="info-box">
      <div style="font-size: 12px; font-weight: 700; color: #718096; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Order Summary (#{$orderId})</div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border-bottom: 1px solid #edf2f7; padding-bottom: 14px;">
        <tr>
          <td style="width: 84px; vertical-align: top; padding-right: 14px; padding-bottom: 12px;">
            <img src="{$productImage}" alt="Samsung 9kg Washing Machine" width="80" height="80" style="display: block; width: 80px; height: 80px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #ffffff; padding: 3px;" />
          </td>
          <td style="vertical-align: top; padding-bottom: 12px;">
            <div class="prod-title">{$productTitle}</div>
            <div class="prod-meta">Quantity: {$qty} &bull; Condition: Brand New &bull; Original Guarantee</div>
            <div style="font-size: 14.5px; font-weight: 700; color: #0b56a4; margin-top: 6px;">R {$amount}</div>
          </td>
        </tr>
      </table>
      <div class="info-row">
        <span>Item Price</span>
        <span>R {$amount}</span>
      </div>
      <div class="info-row">
        <span>Delivery Fee</span>
        <span style="color: #007733; font-weight: 600;">FREE</span>
      </div>
      <div class="info-row">
        <span>Total Paid</span>
        <span>R {$amount}</span>
      </div>
    </div>

    <div style="margin: 22px 0;">
      <div style="font-size: 13.5px; font-weight: 700; color: #1a202c; margin-bottom: 6px;">Delivery Details:</div>
      <div class="address-box">
        <strong>{$name}</strong><br>
        {$address}<br>
        <strong>Estimated Delivery:</strong> 2 - 4 business days
      </div>
    </div>

    <a href="track.html?order={$orderId}" class="cta-btn" target="_blank">Track Your Order on Takealot</a>
    
    <p style="font-size: 12.5px; color: #718096; text-align: center; margin-top: 20px;">
      Questions about your order? Reply directly to this email or visit our Help Centre.
    </p>
  </div>

  <div class="email-footer">
    &copy; 2026 Takealot Online (Pty) Ltd. 12th Floor, Takealot Building, 10 Rua Vasco Da Gama Plain, Foreshore, Cape Town, 8001.<br>
    All rights reserved. Need assistance? Contact <a href="mailto:support@takealot.co.za" style="color: #0b56a4; text-decoration: none;">support@takealot.co.za</a>
  </div>
</div>
</body>
</html>
HTML;

    $payload = [
        "idempotency_key" => "tak-order-{$orderId}-" . time(),
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
            "order_id" => (string)$orderId,
            "store" => "takealot",
            "amount" => (string)$amount
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
