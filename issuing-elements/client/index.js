document.addEventListener("DOMContentLoaded", async () => {
    // Load the publishable key from the server. The publishable key
    // is set in your .env file.
    const { publishableKey, cardId } = await fetch("/config").then(
      (r) => r.json()
    );
    if (!publishableKey) {
      addMessage(
        "No publishable key returned from the server. Please check `.env` and try again"
      );
      alert("Please set your Stripe publishable API key in the .env file");
    }
  
    const stripe = Stripe(publishableKey, {
      apiVersion: "2020-08-27",
      betas: ["issuing_elements_2"]
    });
  
    const elements = stripe.elements();
    let nonce;
    const renderCard = async () => {
      const nonceResult = await stripe.createEphemeralKeyNonce({
        issuingCard: cardId,
      });
      const settings = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardId: cardId,
          nonce: nonceResult.nonce,
        }),
      };
      let response = await fetch("/get_card", settings);
      ephemeralKey = await response.json();
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
      const name = document.getElementById("cardholder-name");
      const number = elements.create("issuingCardNumberDisplay", {
        style,
        issuingCard: cardId,
      });
      const cvc = elements.create("issuingCardCvcDisplay", {
        style,
        issuingCard: cardId,
      });
      const expiry = elements.create("issuingCardExpiryDisplay", {
        style,
        issuingCard: cardId,
      });
      // Mount the card details onto DOM elements in your web application
      name.textContent = cardResult.issuingCard.cardholder.name;
      number.mount("#card-number");
      cvc.mount("#card-cvc");
      expiry.mount("#card-expiry");
    };
    renderCard();
  });
  