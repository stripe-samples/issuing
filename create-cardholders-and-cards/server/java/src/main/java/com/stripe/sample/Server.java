package com.stripe.sample;

import java.util.HashMap;
import java.nio.file.Paths;

import static spark.Spark.get;
import static spark.Spark.post;
import static spark.Spark.staticFiles;
import static spark.Spark.port;

import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

import com.stripe.Stripe;
import com.stripe.net.ApiResource;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.issuing.Cardholder;
import com.stripe.model.issuing.Card;
import com.stripe.exception.*;
import com.stripe.net.Webhook;
import com.stripe.param.issuing.CardholderCreateParams;
import com.stripe.param.issuing.CardCreateParams;

import io.github.cdimascio.dotenv.Dotenv;

public class Server {
  private static Gson gson = new Gson();

  static class CreateCardholderRequest {
    @SerializedName("name")
    String name;

    public String getName() {
      return name;
    }

    @SerializedName("email")
    String email;

    public String getEmail() {
      return email;
    }

    @SerializedName("phone_number")
    String phoneNumber;

    public String getPhoneNumber() {
      return phoneNumber;
    }

    @SerializedName("line1")
    String line1;

    public String getLine1() {
      return line1;
    }

    @SerializedName("city")
    String city;

    public String getCity() {
      return city;
    }

    @SerializedName("state")
    String state;

    public String getState() {
      return state;
    }

    @SerializedName("postal_code")
    String postalCode;

    public String getPostalCode() {
      return postalCode;
    }

    @SerializedName("country")
    String country;

    public String getCountry() {
      return country;
    }
  }

  static class CreateCardRequest {
    @SerializedName("cardholder")
    String cardholderId;

    public String getCardholderId() {
        return cardholderId;
    }

    @SerializedName("status")
    String status;

    public CardCreateParams.Status getStatus() {
        if(status == "on") {
          return CardCreateParams.Status.ACTIVE;
        } else {
          return CardCreateParams.Status.INACTIVE;
        }
    }

    @SerializedName("currency")
    String currency;

    public String getCurrency() {
        return currency;
    }
  }

  static class FailureResponse {
    private HashMap<String, String> error;

    public FailureResponse(String message) {
      this.error = new HashMap<String, String>();
      this.error.put("message", message);
    }
  }

  public static void main(String[] args) {
    port(4242);
    Dotenv dotenv = Dotenv.load();

    Stripe.apiKey = dotenv.get("STRIPE_SECRET_KEY");

    // For sample support and debugging, not required for production:
    Stripe.setAppInfo(
        "stripe-samples/issuing/create-cardholders-and-cards",
        "0.0.1",
        "https://github.com/stripe-samples"
        );

    staticFiles.externalLocation(
        Paths.get(
          Paths.get("").toAbsolutePath().toString(),
          dotenv.get("STATIC_DIR")
          ).normalize().toString());

    post("/create-cardholder", (request, response) -> {
      response.type("application/json");

      CreateCardholderRequest postBody = gson.fromJson(request.body(), CreateCardholderRequest.class);

      CardholderCreateParams createParams = new CardholderCreateParams
          .Builder()
          .setStatus(CardholderCreateParams.Status.ACTIVE)
          .setType(CardholderCreateParams.Type.INDIVIDUAL)
          .setName(postBody.getName())
          .setEmail(postBody.getEmail())
          .setPhoneNumber(postBody.getPhoneNumber())
          .setBilling(CardholderCreateParams.Billing.builder()
                .setAddress(CardholderCreateParams.Billing.Address.builder()
                    .setLine1(postBody.getLine1())
                    .setCity(postBody.getCity())
                    .setState(postBody.getState())
                    .setPostalCode(postBody.getPostalCode())
                    .setCountry(postBody.getCountry())
                    .build())
                .build())
          .build();

      try {
        // Create a PaymentIntent with the order amount and currency
        Cardholder cardholder = Cardholder.create(createParams);

        return gson.toJson(cardholder);
      } catch(StripeException e) {
        response.status(400);
        return gson.toJson(new FailureResponse(e.getMessage()));
      } catch(Exception e) {
        response.status(500);
        return gson.toJson(e);
      }
    });

    post("/create-card", (request, response) -> {
      response.type("application/json");

      try {
        CreateCardRequest postBody = gson.fromJson(request.body(), CreateCardRequest.class);
        CardCreateParams createParams = new CardCreateParams
            .Builder()
            .setType(CardCreateParams.Type.VIRTUAL)
            .setStatus(postBody.getStatus())
            .setCardholder(postBody.getCardholderId())
            .setCurrency(postBody.getCurrency())
            // Include shipping address for physical cards:
            // .setShipping(CardholderCreateParams.Shipping.builder()
            //       .setAddress(CardholderCreateParams.Shipping.Address.builder()
            //           .setLine1(postBody.getLine1())
            //           .setCity(postBody.getCity())
            //           .setState(postBody.getState())
            //           .setPostalCode(postBody.getPostalCode())
            //           .setCountry(postBody.getCountry())
            //           .build())
            //       .build())
            .build();

        Card card = Card.create(createParams);

        return gson.toJson(card);
      } catch(StripeException e) {
        response.status(400);
        return gson.toJson(new FailureResponse(e.getMessage()));
      } catch(Exception e) {
        response.status(500);
        return gson.toJson(e);
      }
    });

    get("/cards/:id", (request, response) -> {
      response.type("application/json");

      try {
        Card card = Card.retrieve(request.params(":id"));
        return gson.toJson(card);
      } catch(StripeException e) {
        response.status(400);
        return gson.toJson(new FailureResponse(e.getMessage()));
      } catch(Exception e) {
        response.status(500);
        return gson.toJson(e);
      }
    });

    post("/webhook", (request, response) -> {
      String payload = request.body();
      String sigHeader = request.headers("Stripe-Signature");
      String endpointSecret = dotenv.get("STRIPE_WEBHOOK_SECRET");

      Event event = null;

      try {
        event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
      } catch (SignatureVerificationException e) {
        // Invalid signature
        response.status(400);
        return "";
      }

      switch (event.getType()) {
        case "issuing_cardholder.created":
          System.out.println("Cardholder created!");
          break;
        case "issuing_card.created":
          System.out.println("Card created!");
          break;
        default:
          // Unexpected event type
          response.status(400);
          return "";
      }

      response.status(200);
      return "";
    });
  }
}
