# Approve an Issuing authorization

A [Sinatra](http://sinatrarb.com/) implementation.

## Requirements

- Ruby v2.4.5+
- [Configured .env file](../README.md)

## How to run

1. Install dependencies

```
bundle install
```

2. Run the application

```
ruby server.rb
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
