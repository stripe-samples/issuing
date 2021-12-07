// To learn more, watch this video: https://www.youtube.com/watch?v=vKptxR9zdCQ
const express = require('express');
const app = express();
const env = require('dotenv').config({path: './.env'});

app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  appInfo: { // For sample support and debugging, not required for production:
    name: "stripe-samples/issuing/approve-authorization",
    version: "0.0.1",
    url: "https://github.com/stripe-samples"
  }
});

app.post('/webhook', async (req, res) => {
  let event;

  if (process.env.STRIPE_WEBHOOK_SECRET) {
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

  if (req.body.type === 'issuing_authorization.request') {
    const auth = event.data.object;
    await handleAuthRequest(auth)
  }

  res.json({received: true});
});

const handleAuthRequest = async (auth) => {
  // Authorize the transaction.
  await stripe.issuing.authorizations.approve(auth.id);
  console.log(`Approved 🎉`);
}

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));
