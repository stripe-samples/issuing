<?php
// Using Slim.
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Stripe\Stripe;

require_once('vendor/autoload.php');

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$app = AppFactory::create();

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

$app->post('/webhook', function (Request $request, Response $response, $args) {
  $payload = $request->getBody();
  $sig_header = $request->getHeaderLine('stripe-signature');

  $event = null;

  // Uncomment and replace with a real secret. You can find your endpoint's
  // secret in your webhook settings.
  $webhook_secret = $_ENV['STRIPE_WEBHOOK_SECRET']

  // Verify webhook signature and extract the event.
  try {
    $event = \Stripe\Webhook::constructEvent(
      $payload, $sig_header, $webhook_secret
    );
  } catch(\UnexpectedValueException $e) {
    // Invalid payload.
    return $response->withStatus(400);
  } catch(\Stripe\Exception\SignatureVerificationException $e) {
    // Invalid signature.
    return $response->withStatus(400);
  }

  if ($event->type == 'issuing_authorization.request') {
    $auth = $event->data->object;
    handleAuthorizationRequest($auth);
  }

  return $response->withStatus(200);
});

function handleAuthorizationRequest($auth) {
  # Authorize the transaction.
  $authorization = \Stripe\Issuing\Authorization::retrieve($auth['id']);
  $authorization->approve();
};

$app->run();
