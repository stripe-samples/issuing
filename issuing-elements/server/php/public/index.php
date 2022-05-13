<?php
require_once 'shared.php';
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Stripe Sample</title>
    <meta name="description" content="A demo of Stripe" />

    <link rel="icon" href="favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="css/normalize.css" />
    <link rel="stylesheet" href="css/global.css" />
    <script src="https://js.stripe.com/v3/"></script>
    <script>
  document.addEventListener("DOMContentLoaded", async () => {
    // Load the publishable key from the server. The publishable key
    // is set in your .env file.

    // Initialize Stripe.js
    const stripe = Stripe("<?= $_ENV['STRIPE_PUBLISHABLE_KEY']; ?>", {
      apiVersion: "2020-08-27",
      betas: ["issuing_elements_2"] // Only needed during the beta.
    });

    const cardId = "<?= $_ENV['DEMO_CARD_ID']; ?>";

    // Create an ephemeral key nonce using the ID of the issued card.
    const nonceResult = await stripe.createEphemeralKeyNonce({
      issuingCard: cardId,
    });

    // Pass the nonce to the server to create a new ephemeral key
    // for the card, so that we can retrieve its details client side.
    const { ephemeralKey } = await fetch("/create-card-key.php", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardId: cardId,
        nonce: nonceResult.nonce,
        apiVersion: '2020-08-27',
      }),
    }).then(r => r.json());

    // Retrieve the card
    const cardResult = await stripe.retrieveIssuingCard(cardId, {
      ephemeralKeySecret: ephemeralKey.secret,
      nonce: nonceResult.nonce,
    });

    const style = {
      base: {
        color: "white",
        fontSize: "14px",
        lineHeight: "24px",
      },
    };

    // Mount and display the card details
    const elements = stripe.elements();
    const number = elements.create("issuingCardNumberDisplay", {
      style,
      issuingCard: cardId,
    });
    number.mount("#card-number");

    const cvc = elements.create("issuingCardCvcDisplay", {
      style,
      issuingCard: cardId,
    });
    cvc.mount("#card-cvc");

    const expiry = elements.create("issuingCardExpiryDisplay", {
      style,
      issuingCard: cardId,
    });
    expiry.mount("#card-expiry");

    // Mount the card details onto DOM elements in your web application
    const name = document.getElementById("cardholder-name");
    name.textContent = cardResult.issuingCard.cardholder.name;
  });
    </script>
  </head>
  <body>
    <div id="details-container">
      <div id="card-container" class="col-span-1">
        <div id="card-back">
          <div id="card-details">
            <div id="cardholder-name"></div>
            <div id="card-number"></div>
            <div id="expiry-cvc-wrapper">
              <div id="expiry-wrapper">
                <div>EXP</div>
                <div id="card-expiry"></div>
              </div>
              <div id="cvc-wrapper">
                <div>CVV</div>
                <div id="card-cvc"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
