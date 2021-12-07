# Approve an Issuing authorization

An [Express server](http://expressjs.com) implementation

## Requirements

- Node v10+
- [Configured .env file](../README.md)

## How to run

1. Install dependencies

```
npm install
```

2. Run the application

```
npm start
```

3. Forward Stripe events to your local server

```
stripe listen --forward-to localhost:4242/webhook
```

4. Trigger a new authorization request

via CLI

```
stripe trigger issuing_authorization.request
```

or see our docs on testing via dashboard here https://stripe.com/docs/issuing/testing?testing-method=without-code.
