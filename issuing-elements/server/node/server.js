const express = require("express");
const app = express();
const { resolve } = require("path");

// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
  appInfo: {
    // For sample support and debugging, not required for production:
    name: "stripe-samples/<your-sample-name>",
    version: "0.0.1",
    url: "https://github.com/stripe-samples",
  },
});

//In your application the StripedemoCardID will be provided as part of the context of the request, in this case we are going to hardcode them from the .env file
DemoCardID = process.env.DEMO_CARD_ID;

//If you are using Stripe Issuing with Stripe connect you will need to specify the Account ID on the header of the request.

app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    cardId: DemoCardID,
  });
});

app.post("/create-payment-intent", async (req, res) => {
  const { currency } = req.body;

  // Create a PaymentIntent with the amount, currency, and a payment method type.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/payment_intents/create
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1999,
      currency: currency,
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard
// https://dashboard.stripe.com/test/webhooks
app.post("/webhook", async (req, res) => {
  let data, eventType;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === "payment_intent.succeeded") {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log("💰 Payment captured!");
  } else if (eventType === "payment_intent.payment_failed") {
    console.log("❌ Payment failed.");
  }
  res.sendStatus(200);
});

//Route needed for Stripe Issuing Element
app.post("/get_card", async (req, res) => {
  async function getEphemeralKey(cardId, nonce) {
    const qs = require("qs");
    const axios = require("axios").default;
    axios.defaults.baseURL = "https://api.stripe.com";
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + process.env.STRIPE_SECRET_KEY;
    axios.defaults.headers.common["Content-Type"] =
      "application/x-www-form-urlencoded";
    data = qs.stringify({
      issuing_card: cardId,
      nonce: nonce,
    });
    var config = {
      method: "POST",
      url: "https://api.stripe.com/v1/ephemeral_keys",
      headers: {
        "Stripe-Version": "2020-03-02"
      },
      data: data,
    };
    try {
      result = await axios(config);
      return result;
    } catch (error) {
      console.error(error);
    }
  }
  
  let cardId = req.body.cardId;
  let nonce = req.body.nonce;

  ephemeralKey = await getEphemeralKey(cardId, nonce);

  //Check if we have a result
  if (ephemeralKey) {
    res.status(200).send(ephemeralKey.data);
  } else {
    res.status(500).json({ statusCode: 500, message: "Error" });
  }
});

app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
