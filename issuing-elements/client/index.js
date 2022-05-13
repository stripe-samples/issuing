document.addEventListener("DOMContentLoaded", async () => {
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  const { publishableKey, cardId } = await fetch("/config").then((r) => r.json());
  if (!publishableKey) {
    addMessage(
      "No publishable key returned from the server. Please check `.env` and try again"
    );
    alert("Please set your Stripe publishable API key in the .env file");
  }

  // Initialize Stripe.js
  const stripe = Stripe(publishableKey, {
    apiVersion: "2020-08-27",
    betas: ["issuing_elements_2"] // Only needed during the beta.
  });

  // Create an ephemeral key nonce using the ID of the issued card.
  const nonceResult = await stripe.createEphemeralKeyNonce({
    issuingCard: cardId,
  });

  // Pass the nonce to the server to create a new ephemeral key
  // for the card, so that we can retrieve its details client side.
  const { ephemeralKey } = await fetch("/create-card-key", {
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
