const express = require("express");
const app = express();
const { resolve } = require("path");

// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
  appInfo: {
    // For sample support and debugging, not required for production:
    name: "stripe-samples/issuing/issuing-elements",
    version: "0.0.1",
    url: "https://github.com/stripe-samples",
  },
});


//If you are using Stripe Issuing with Stripe connect you will need to specify the Account ID on the header of the request.

app.use(express.static(process.env.STATIC_DIR));

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  // You'll likely store the IDs of issued cards in your
  // database in this demo the ID of the card is set in the
  // .env file.
  res.send({
    cardId: process.env.DEMO_CARD_ID,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

//Route needed for Stripe Issuing Element
app.post("/create-card-key", async (req, res) => {
  const { cardId, nonce, apiVersion } = req.body;
  try {
    const ephemeralKey = await stripe.ephemeralKeys.create({
      issuing_card: cardId,
      nonce: nonce,
    }, {
      apiVersion: apiVersion,
    })
    res.send({ ephemeralKey });
  } catch(e) {
    console.error(e)
    res.status(400).json({
      error: {
        message: e.message
      }
    })
  }
});

app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
