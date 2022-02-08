const express = require('express');
const app = express();
const { resolve } = require('path');
// Replace if using a different env file or config
const env = require('dotenv').config({ path: './.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  appInfo: { // For sample support and debugging, not required for production:
    name: "stripe-samples/issuing/create-cardholder-and-card",
    version: "0.0.1",
    url: "https://github.com/stripe-samples"
  }
});

app.use(express.static(process.env.STATIC_DIR));
app.use(express.urlencoded());
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function(req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    }
  })
);

app.get('/', (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});

app.post('/create-cardholder', async (req, res) => {
  const { name, email, phone_number, line1, city, state, postal_code, country } = req.body;

  // Create a Cardholder.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/issuing/cardholders/create
  try {
    const cardholder = await stripe.issuing.cardholders.create({
      name: name,
      email: email,
      phone_number: phone_number,
      status: 'active',
      type: 'individual',
      billing: {
        address: {
          line1: line1,
          city: city,
          state: state,
          postal_code: postal_code,
          country: country,
        },
      },
    });

    res.send(cardholder)
  } catch(e) {
    return res.status(400).send({
      error: {
        message: e.message
      }
    });
  }
});

app.post('/create-card', async (req, res) => {
  const { cardholder, currency, status, name, line1, city, state, postal_code, country } = req.body;

  // Create a Card.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/issuing/cards/create
  try {
    const card = await stripe.issuing.cards.create({
      cardholder: cardholder,
      currency: currency,
      type: 'virtual',
      status: status ? 'active' : 'inactive',

      // Include shipping address for physical cards:
      // shipping: {
      //   name: name,
      //   address: {
      //     line1: line1,
      //     city: city,
      //     state: state,
      //     postal_code: postal_code,
      //     country: country,
      //   },
      // },
    });

    res.send(card)
  } catch(e) {
    return res.status(400).send({
      error: {
        message: e.message
      }
    });
  }
});

// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard
// https://dashboard.stripe.com/test/webhooks
app.post('/webhook', async (req, res) => {
  let data, eventType;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
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

  if (eventType === 'issuing_cardholder.created') {
    console.log('Cardholder created!');
  } else if (eventType === 'issuing_card.created') {
    console.log('Card created!');
  }
  res.sendStatus(200);
});

app.listen(4242, () => console.log(`Node server listening at http://localhost:4242`));
