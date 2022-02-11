<?php

require_once 'shared.php';
header('Content-Type: application/json');

$input = file_get_contents('php://input');
$body = json_decode($input);
$event = null;

try {
  // Make sure the event is coming from Stripe by checking the signature header
  $event = \Stripe\Webhook::constructEvent(
    $input,
    $_SERVER['HTTP_STRIPE_SIGNATURE'],
    $_ENV['STRIPE_WEBHOOK_SECRET']
  );
}
catch (Exception $e) {
  http_response_code(403);
  echo json_encode([ 'error' => $e->getMessage() ]);
  exit;
}

if ($event->type == 'issuing_cardholder.created') {
  error_log('Cardholder created!');
}
else if ($event->type == 'issuing_card.created') {
  error_log('Card created!');
}

echo json_encode(['status' => 'success']);
