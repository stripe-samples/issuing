<?php
require_once 'shared.php';

// Create a Card.
//
// See the documentation [0] for the full list of supported parameters.
//
// [0] https://stripe.com/docs/api/issuing/cards/create
try {
  $card = $stripe->issuing->cards->create([
    'cardholder' => $_POST['cardholder'],
    'currency' => $_POST['currency'],
    'type' => 'virtual',
    'status' => $_POST['status'] ? 'active' : 'inactive',

    // Include shipping address for physical cards:
    // 'shipping' => [
    //   'address' => [
    //     'city' => $_POST['city'],
    //     'state' => $_POST['state'],
    //     'postal_code' => $_POST['postal_code'],
    //     'country' => $_POST['country'],
    //     'line1' => $_POST['line1'],
    //   ]
    // ]
  ]);
} catch (\Stripe\Exception\ApiErrorException $e) {
  http_response_code(400);
  error_log($e->getError()->message);
?>
  <h1>Error</h1>
  <p>Failed to create a Card.</p>
  <p>Please check the server logs for more information.</p>
<?php
  exit;
} catch (Exception $e) {
  error_log($e);
  http_response_code(500);
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Stripe Issuing Sample</title>
    <meta name="description" content="Create Stripe Issuing Cardholders and Cards" />

    <link rel="icon" href="favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="css/normalize.css" />
    <link rel="stylesheet" href="css/global.css" />
    <script src="https://js.stripe.com/v3/"></script>
  </head>

  <body>
    <div class="sr-root">
      <div class="sr-main">
        <h1><?= $card->id; ?> created successfully.</h1>
      </div>
    </div>
  </body>
</html>
