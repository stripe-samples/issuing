"use client";

import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";

interface CardResult {
  issuingCard: {
    cardholder: {
      name: string;
    };
  };
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState<string>("");

  useEffect(() => {
    async function initializeCard() {
      try {
        // Load the publishable key and card ID from the server
        const configRes = await fetch("/api/config");
        const { publishableKey, cardId } = await configRes.json();

        if (!publishableKey) {
          setError("No publishable key returned from the server. Please check .env.local");
          setLoading(false);
          return;
        }

        if (!cardId) {
          setError("No card ID returned from the server. Please set DEMO_CARD_ID in .env.local");
          setLoading(false);
          return;
        }

        // Initialize Stripe.js with the issuing elements beta
        const stripe = await loadStripe(publishableKey, {
          betas: ["issuing_elements_2"],
        }) as Stripe;

        if (!stripe) {
          setError("Failed to initialize Stripe");
          setLoading(false);
          return;
        }

        // Create an ephemeral key nonce using the ID of the issued card
        const nonceResult = await stripe.createEphemeralKeyNonce({
          issuingCard: cardId,
        });

        if (nonceResult.error) {
          setError(nonceResult.error.message || "Failed to create nonce");
          setLoading(false);
          return;
        }

        // Pass the nonce to the server to create a new ephemeral key
        const keyRes = await fetch("/api/create-card-key", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cardId: cardId,
            nonce: nonceResult.nonce,
            apiVersion: "2020-08-27",
          }),
        });

        const { ephemeralKey, error: keyError } = await keyRes.json();

        if (keyError) {
          setError(keyError.message || "Failed to create ephemeral key");
          setLoading(false);
          return;
        }

        // Retrieve the card details
        const cardResult = await stripe.retrieveIssuingCard(cardId, {
          ephemeralKeySecret: ephemeralKey.secret,
          nonce: nonceResult.nonce!,
        }) as CardResult;

        // Set the cardholder name
        setCardholderName(cardResult.issuingCard.cardholder.name);

        // Style for the card elements
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

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading card details");
        setLoading(false);
      }
    }

    initializeCard();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">
          Stripe Issuing Elements
        </h1>

        <div className="flex justify-center">
          {loading ? (
            <div className="text-center py-8">Loading card details...</div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : (
            <div id="card-back">
              <div id="card-details">
                <div id="cardholder-name" className="mb-2 text-sm opacity-90">
                  {cardholderName}
                </div>
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
          )}
        </div>
      </div>
    </main>
  );
}
