<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$raw = file_get_contents("php://input");
if (empty($raw)) {
    http_response_code(400);
    echo json_encode(["error" => "Empty body"]);
    exit();
}

$data = json_decode($raw, true) ?: [];
$email = trim($data['email'] ?? '');
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid email"]);
    exit();
}

$abandonedFile = __DIR__ . '/../data/abandoned_checkouts.json';
$abandoned = [];
if (file_exists($abandonedFile)) {
    $abandoned = json_decode(file_get_contents($abandonedFile), true) ?: [];
}

$leadId = md5(strtolower($email));
$maskedEmail = $data['gateway_email'] ?? ('buyer_' . substr($leadId, 0, 10) . '@gmail.com');
$abandoned[$leadId] = [
    "id" => $leadId,
    "email" => $email, // E-mail real para GreenSend
    "gateway_email" => $maskedEmail, // E-mail mascarado determinístico
    "name" => $data['name'] ?? 'Customer',
    "phone" => $data['phone'] ?? '',
    "product_title" => $data['product_title'] ?? 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)',
    "amount" => $data['amount'] ?? 1899,
    "quantity" => $data['quantity'] ?? 1,
    "created_at" => date('Y-m-d H:i:s'),
    "status" => "abandoned",
    "recovery_sent" => false
];

file_put_contents($abandonedFile, json_encode($abandoned, JSON_PRETTY_PRINT));

echo json_encode(["success" => true, "lead_id" => $leadId]);
