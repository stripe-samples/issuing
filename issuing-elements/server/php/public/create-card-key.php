<?php

require_once 'shared.php';

$data = json_decode(file_get_contents('php://input'), TRUE);

try {
  $ephemeralKey = $stripe->ephemeralKeys->create([
    'issuing_card' => $data['cardId'],
    'nonce' => $data['nonce'],
  ], [
    'stripe_version' => $data['apiVersion'],
  ]);
  error_log(print_r($ephemeralKey, TRUE));
  echo json_encode(['ephemeralKey' => $ephemeralKey]);
} catch (\Stripe\Exception\ApiErrorException $e) {
  error_log("An error occurred: {$e->getError()->message}");
  http_response_code(400);
  echo json_encode(['error' => ['message' => $e->getError()->message]]);
} catch (Exception $e) {
  error_log($e);
  http_response_code(500);
  exit;
}
?>
