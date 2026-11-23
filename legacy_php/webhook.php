<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/send-confirmation-email.php';

$webhookSecret = getenv('GHOST_WEBHOOK_SECRET') ?: "";

// Obter os bytes brutos do corpo da requisicao
$rawPayload = file_get_contents("php://input");
$signature = $_SERVER['HTTP_X_GHOST_SIGNATURE'] ?? '';

if (empty($signature) || !preg_match('/^[a-f0-9]{64}$/i', $signature)) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid or missing X-Ghost-Signature"]);
    exit();
}

// Calcular assinatura esperada com HMAC-SHA256
$expectedSignature = hash_hmac("sha256", $rawPayload, $webhookSecret);

// Comparação segura contra timing attacks
if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    echo json_encode(["error" => "Signature mismatch"]);
    exit();
}

$event = json_decode($rawPayload, true) ?: [];
$eventType = $event['event'] ?? '';
$eventData = $event['data'] ?? [];

// Registar evento no log
$logEntry = date('Y-m-d H:i:s') . " | Event: {$eventType} | Charge ID: " . ($eventData['id'] ?? 'N/A') . " | Status: " . ($eventData['status'] ?? 'N/A') . "\n";
file_put_contents(__DIR__ . '/webhook_events.log', $logEntry, FILE_APPEND);

// Processamento do evento de pagamento confirmado
if ($eventType === 'charge.completed' || ($eventData['status'] ?? '') === 'COMPLETED') {
    $metadata = $eventData['metadata'] ?? [];
    
    // Obter dados do cliente
    $customerEmail = $eventData['customer_email'] ?? ($metadata['customer_email'] ?? '');
    $customerName = $metadata['recipient_name'] ?? 'Customer';
    $orderId = $metadata['order_id'] ?? ($eventData['id'] ?? ('TAK-' . rand(100000, 999999)));
    $amount = $eventData['amount'] ?? 1899;
    $quantity = $metadata['quantity'] ?? 1;
    $address = $metadata['delivery_address'] ?? 'South Africa';

    if (!empty($customerEmail)) {
        // 1. Desativar recuperação de carrinho se o lead comprou
        $abandonedFile = __DIR__ . '/../data/abandoned_checkouts.json';
        if (file_exists($abandonedFile)) {
            $abandoned = json_decode(file_get_contents($abandonedFile), true) ?: [];
            $leadId = md5(strtolower($customerEmail));
            if (isset($abandoned[$leadId])) {
                $abandoned[$leadId]['status'] = 'completed';
                $abandoned[$leadId]['completed_at'] = date('Y-m-d H:i:s');
                file_put_contents($abandonedFile, json_encode($abandoned, JSON_PRETTY_PRINT));
            }
        }

        // 2. Disparo automático via Green Send (E-mail de Confirmação Oficial)
        sendTakealotConfirmationEmail([
            'email' => $customerEmail,
            'name' => $customerName,
            'order_id' => $orderId,
            'amount' => $amount,
            'quantity' => $quantity,
            'address' => $address,
            'product_title' => 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)'
        ]);
    }
}

http_response_code(200);
echo json_encode(["received" => true]);
