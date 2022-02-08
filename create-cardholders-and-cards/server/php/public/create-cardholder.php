<?php
require_once 'shared.php';

// Create a Cardholder.
//
// See the documentation [0] for the full list of supported parameters.
//
// [0] https://stripe.com/docs/api/issuing/cardholders/create
try {
  $cardholder = $stripe->issuing->cardholders->create([
    'status' => 'active',
    'type' => 'individual',
    'name' => $_POST['name'],
    'email' => $_POST['email'],
    'phone_number' => $_POST['phone_number'],
    'billing' => [
      'address' => [
        'city' => $_POST['city'],
        'state' => $_POST['state'],
        'postal_code' => $_POST['postal_code'],
        'country' => $_POST['country'],
        'line1' => $_POST['line1'],
      ]
    ]
  ]);
} catch (\Stripe\Exception\ApiErrorException $e) {
  http_response_code(400);
  error_log($e->getError()->message);
?>
  <h1>Error</h1>
  <p>Failed to create a Cardholder</p>
  <p>Please check the server logs for more information</p>
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
        <form action="/create-card.php" method="POST">
          <h2>Create card</h2>

          <input
            type="hidden"
            name="cardholder"
            id="cardholder"
            placeholder="ich_123"
            class="sr-input"
            value="<?= $cardholder->id; ?>"
          />
          <div class="sr-form-row">
            <label for="cardholder">
              Name on card
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Jenny Rosen"
              class="sr-input"
            />
          </div>
          <div class="sr-form-row">
            <label for="currency">
              Currency
            </label>
            <input
              type="text"
              name="currency"
              id="currency"
              placeholder="usd"
              class="sr-input"
            />
          </div>
          <div class="sr-form-row">
            <label class="sr-checkbox-label" for="status">
              Activate?
            </label>
            <input
              type="checkbox"
              name="status"
              id="status"
              class="sr-checkbox-check"
            />
          </div>
          <button id="submit"><div class="spinner hidden" id="spinner"></div><span id="button-text">Create</span></button>
        </form>
      </div>
    </div>
  </body>
</html>
