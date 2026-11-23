<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$code = trim($_GET['code'] ?? ($_GET['order'] ?? ''));
if (empty($code)) {
    $raw = file_get_contents("php://input");
    if (!empty($raw)) {
        $json = json_decode($raw, true) ?: [];
        $code = trim($json['code'] ?? ($json['order_id'] ?? ''));
    }
}

$code = strtoupper(preg_replace('/[^a-zA-Z0-9\-]/', '', $code));

if (empty($code)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Please enter an order number or tracking code."]);
    exit();
}

$ordersFile = __DIR__ . '/../data/orders.json';
$orders = [];
if (file_exists($ordersFile)) {
    $orders = json_decode(file_get_contents($ordersFile), true) ?: [];
}

// 1. Procura na base de dados JSON salva
if (isset($orders[$code])) {
    echo json_encode(["success" => true, "order" => $orders[$code]]);
    exit();
}

// Procura por ID parcial ou maiúsculo/minúsculo
foreach ($orders as $k => $v) {
    if (strtoupper($k) === $code || (isset($v['waybill']) && strtoupper($v['waybill']) === $code)) {
        echo json_encode(["success" => true, "order" => $v]);
        exit();
    }
}

// 2. Se for um código no formato TAK-XXXXXX (pedido Takealot recente)
if (preg_match('/^TAK-?/i', $code) || strlen($code) >= 6) {
    // Gerar status dinâmico realista de rastreamento Takealot
    $is75 = (strpos($code, '75') !== false);
    $is65 = (strpos($code, '65') !== false);
    
    $title = 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
    $img = 'imagens/samsung_washing machine_1_hero.jpg';
    $amount = 1899;
    $size = '65"';
    
    if ($is75) {
        $title = 'Samsung 42L Smart Inverter Washing Machine Oven (MS4295DIS)';
        $img = 'imagens/tv_75_1.png';
        $amount = 1899;
        $size = '75"';
    } elseif ($is65) {
        $title = 'Samsung 9kg EcoBubble™ Front Loader Washing Machine (WW90TA046AX)';
        $img = 'imagens/samsung_washing machine_1_hero.jpg';
        $amount = 1899;
        $size = '65"';
    }

    $dynamicOrder = [
        "order_id" => $code,
        "tracking_code" => $code,
        "courier" => "Takealot Logistics Express",
        "waybill" => "WB-ZAF-" . substr(abs(crc32($code)), 0, 6),
        "status" => "in_transit",
        "status_text" => "In Transit - Out for Delivery",
        "status_step" => 3,
        "customer_name" => "Valued Takealot Customer",
        "customer_email" => "customer@takealot.co.za",
        "customer_phone" => "+27 82 555 1234",
        "delivery_address" => "Cape Town & Surrounds, Western Cape, South Africa",
        "product_title" => $title,
        "product_image" => $img,
        "screen_size" => $size,
        "quantity" => 1,
        "amount" => $amount,
        "currency" => "ZAR",
        "created_at" => date("d M Y, H:i"),
        "estimated_delivery" => date("d M Y", strtotime("+2 days")) . " - " . date("d M Y", strtotime("+4 days")),
        "timeline" => [
            [
                "title" => "Order Placed & Payment Confirmed",
                "desc" => "Payment of R {$amount} confirmed via Ghost Pay",
                "time" => date("d M Y, 10:30"),
                "completed" => true
            ],
            [
                "title" => "Packed at Fulfilment Centre",
                "desc" => "Takealot Cape Town Distribution Centre",
                "time" => date("d M Y, 11:45"),
                "completed" => true
            ],
            [
                "title" => "Out for Delivery",
                "desc" => "Dispatched with driver on local delivery route",
                "time" => "Today, " . date("H:i"),
                "completed" => true,
                "current" => true
            ],
            [
                "title" => "Delivered to Customer",
                "desc" => "Package delivered and signed",
                "time" => "Estimated: " . date("d M Y", strtotime("+2 days")),
                "completed" => false
            ]
        ]
    ];

    // Salva na base de dados para futuras consultas consistentes
    $orders[$code] = $dynamicOrder;
    file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));

    echo json_encode(["success" => true, "order" => $dynamicOrder]);
    exit();
}

http_response_code(404);
echo json_encode([
    "success" => false, 
    "error" => "Order not found. Please verify your order number (e.g. TAK-75-343042 or TAK-991839) and try again."
]);
