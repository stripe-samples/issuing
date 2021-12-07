package com.stripe.sample;

import static spark.Spark.post;
import static spark.Spark.port;
import spark.Response;

import io.github.cdimascio.dotenv.Dotenv;

import com.stripe.Stripe;
import com.stripe.model.issuing.Authorization;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.exception.*;
import com.stripe.net.Webhook;
import com.google.gson.JsonSyntaxException;

// Using Spark.
import static spark.Spark.*;

public class Server {
  public static void main(String[] args) {
    port(4242);
    Dotenv dotenv = Dotenv.load();
    Stripe.apiKey = dotenv.get("STRIPE_SECRET_KEY");

    // For sample support and debugging, not required for production:
    Stripe.setAppInfo(
        "stripe-samples/issuing/approve-authorization",
        "0.0.1",
        "https://github.com/stripe-samples");

    post("/webhook", (request, response) -> {
      String payload = request.body();
      String sigHeader = request.headers("Stripe-Signature");
      String endpointSecret = dotenv.get("STRIPE_WEBHOOK_SECRET");

      Event event = null;

      // Verify webhook signature and extract the event.
      try {
        event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
      } catch (SignatureVerificationException e) {
        // Invalid signature
        response.status(400);
        return "";
      }

      if (event.getType() == "issuing_authorization.request") {
        // Deserialize the nested object inside the event
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        if (dataObjectDeserializer.getObject().isPresent()) {
          Authorization auth = (Authorization) dataObjectDeserializer.getObject().get();
          handleAuthorizationRequest(auth);
        }
      }

      response.status(200);
      return "";
    });
  }

  private static void handleAuthorizationRequest(Authorization auth) {
    // Approve the authorization.
    try {
      Authorization authorization = Authorization.retrieve(auth.getId());
      authorization.approve();
      System.out.println("Approved!");
    } catch (StripeException e) {
      System.out.println("Approval failed.");
    }
  }
}
