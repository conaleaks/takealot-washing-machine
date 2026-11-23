<?php
/**
 * Cron Job para processar e-mails de recuperação de checkout
 * Pode ser executado via linha de comando ou requisição agendada
 */

require_once __DIR__ . '/send-recovery-sequence.php';

$abandonedFile = __DIR__ . '/../data/abandoned_checkouts.json';
if (!file_exists($abandonedFile)) {
    echo "No abandoned checkouts found.\n";
    exit();
}

$abandoned = json_decode(file_get_contents($abandonedFile), true) ?: [];
$now = time();
$updated = false;

foreach ($abandoned as $id => &$lead) {
    // Se já pagou, ignora
    if (($lead['status'] ?? '') === 'completed') continue;

    $createdAt = strtotime($lead['created_at'] ?? 'now');
    $diffMinutes = round(($now - $createdAt) / 60);
    $diffHours = round($diffMinutes / 60);
    $currentStep = intval($lead['recovery_step'] ?? 0);

    // 1º E-mail (entre 15 a 30 minutos)
    if ($diffMinutes >= 15 && $currentStep < 1) {
        if (sendRecoveryEmailStep(1, $lead)) {
            $lead['recovery_step'] = 1;
            $lead['last_recovery_sent'] = date('Y-m-d H:i:s');
            $updated = true;
            echo "Step 1 sent to {$lead['email']}\n";
        }
    }
    // 2º E-mail (após 6 horas)
    elseif ($diffHours >= 6 && $currentStep === 1) {
        if (sendRecoveryEmailStep(2, $lead)) {
            $lead['recovery_step'] = 2;
            $lead['last_recovery_sent'] = date('Y-m-d H:i:s');
            $updated = true;
            echo "Step 2 sent to {$lead['email']}\n";
        }
    }
    // 3º E-mail (após 24 horas)
    elseif ($diffHours >= 24 && $currentStep === 2) {
        if (sendRecoveryEmailStep(3, $lead)) {
            $lead['recovery_step'] = 3;
            $lead['last_recovery_sent'] = date('Y-m-d H:i:s');
            $updated = true;
            echo "Step 3 sent to {$lead['email']}\n";
        }
    }
}

if ($updated) {
    file_put_contents($abandonedFile, json_encode($abandoned, JSON_PRETTY_PRINT));
}

echo "Check completed at " . date('Y-m-d H:i:s') . "\n";
