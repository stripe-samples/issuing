# Approve an Issuing authorization

## Requirements

- Maven
- Java
- [Configured .env file](../README.md)

1. Build the jar

```
mvn package
```

2. Run the packaged jar

```
java -cp target/sample-jar-with-dependencies.jar com.stripe.sample.Server
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
