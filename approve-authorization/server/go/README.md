# Approve an Issuing authorization

## Requirements

- Go 1.13
- [Configured .env file](../README.md)

## How to run

1. Install dependencies

```
go mod tidy
go mod vendor
```

2. Run the application

```
go run server.go
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
