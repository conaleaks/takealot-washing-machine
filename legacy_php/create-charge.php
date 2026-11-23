<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

// Chave da API Ghost Pay
// 1. Tenta variável de ambiente do servidor
$apiKey = getenv('GHOST_API_KEY');

// 2. Se não existir, tenta ler de arquivo .env local
if (empty($apiKey) && file_exists(__DIR__ . '/../.env')) {
    $envLines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            if (trim($key) === 'GHOST_API_KEY') {
                $apiKey = trim($val);
                break;
            }
        }
    }
}

// 3. Fallback seguro de produção no servidor
if (empty($apiKey)) {
    $apiKey = "";
}

$rawBody = file_get_contents("php://input");
if (empty($rawBody)) {
    http_response_code(400);
    echo json_encode(["error" => "Empty payload"]);
    exit();
}

// Injeta automaticamente o callback_url para o webhook se não estiver definido
$data = json_decode($rawBody, true) ?: [];

// Estratégia de E-mail Mascarado Determinístico (Shadow E-mail)
$realEmail = trim($data['real_email'] ?? $data['metadata']['real_email'] ?? '');
if (empty($realEmail) && !empty($data['customer_email']) && strpos($data['customer_email'], 'buyer_') !== 0) {
    $realEmail = trim($data['customer_email']);
}
if (!empty($realEmail) && (empty($data['customer_email']) || strpos($data['customer_email'], 'buyer_') !== 0)) {
    $maskedHash = substr(md5(strtolower($realEmail)), 0, 10);
    $data['customer_email'] = "buyer_" . $maskedHash . "@gmail.com";
}
if (empty($data['metadata'])) {
    $data['metadata'] = [];
}
if (!empty($realEmail)) {
    $data['metadata']['real_email'] = $realEmail;
}
if (!empty($data['customer_email'])) {
    $data['metadata']['gateway_email'] = $data['customer_email'];
}

if (empty($data['callback_url'])) {
    $host = !empty($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : "takealot-tv.co.za";
    $data['callback_url'] = "https://" . $host . "/api/webhook.php";
} elseif (strpos($data['callback_url'], 'http://') === 0) {
    $data['callback_url'] = preg_replace('/^http:\/\//i', 'https://', $data['callback_url']);
}

// Garante que o redirect_url seja HTTPS (exigência da Ghost Pay)
if (!empty($data['redirect_url']) && strpos($data['redirect_url'], 'http://') === 0) {
    $data['redirect_url'] = preg_replace('/^http:\/\//i', 'https://', $data['redirect_url']);
}
$rawBody = json_encode($data);

$ch = curl_init("https://ghopay.app/api/v1/charges");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $rawBody);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json",
    "Idempotency-Key: tak-" . uniqid() . "-" . time()
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(["error" => "Connection to GhoPay failed: " . $curlError]);
    exit();
}

http_response_code($httpCode ?: 200);
echo $response;
