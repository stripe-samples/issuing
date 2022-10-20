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
import com.stripe.net.RequestOptions;
import com.stripe.model.EphemeralKey;
import com.stripe.exception.*;
import com.stripe.param.EphemeralKeyCreateParams;

import io.github.cdimascio.dotenv.Dotenv;

public class Server {
  private static Gson gson = new Gson();

  static class CreateCardKeyRequest {
    @SerializedName("cardId")
    String cardId;

    @SerializedName("nonce")
    String nonce;

    @SerializedName("apiVersion")
    String apiVersion;

    public String getCardId() {
      return cardId;
    }

    public String getNonce() {
      return nonce;
    }

    public String getApiVersion() {
      return apiVersion;
    }
  }

  static class ConfigResponse {
    private String publishableKey;
    private String cardId;

    public ConfigResponse(String publishableKey, String cardId) {
      this.publishableKey = publishableKey;
      this.cardId = cardId;
    }
  }

  static class FailureResponse {
    private HashMap<String, String> error;

    public FailureResponse(String message) {
      this.error = new HashMap<String, String>();
      this.error.put("message", message);
    }
  }

  static class CreateCardKeyResponse {
    private EphemeralKey ephemeralKey;

    public CreateCardKeyResponse(EphemeralKey ephemeralKey) {
      this.ephemeralKey = ephemeralKey;
    }
  }

  public static void main(String[] args) {
    port(4242);
    Dotenv dotenv = Dotenv.load();

    Stripe.apiKey = dotenv.get("STRIPE_SECRET_KEY");

    // For sample support and debugging, not required for production:
    Stripe.setAppInfo(
        "stripe-samples/issuing/issuing-elements",
        "0.0.1",
        "https://github.com/stripe-samples");

    staticFiles.externalLocation(Paths.get(
        Paths.get("").toAbsolutePath().toString(),
        dotenv.get("STATIC_DIR")).normalize().toString());

    get("/config", (request, response) -> {
      response.type("application/json");

      // You'll likely store the IDs of issued cards in your
      // database in this demo the ID of the card is set in the
      // .env file.
      return gson.toJson(new ConfigResponse(dotenv.get("STRIPE_PUBLISHABLE_KEY"), dotenv.get("DEMO_CARD_ID")));
    });

    post("/create-card-key", (request, response) -> {
      response.type("application/json");

      CreateCardKeyRequest postBody = gson.fromJson(request.body(), CreateCardKeyRequest.class);

      EphemeralKeyCreateParams createParams = new EphemeralKeyCreateParams
        .Builder()
        .setIssuingCard(postBody.getCardId())
        .putExtraParam("nonce", postBody.getNonce())
        .build();

      RequestOptions requestParams = RequestOptions
        .builder()
        .setStripeVersionOverride(postBody.getApiVersion())
        .build();

      try {
        // Create a PaymentIntent with the order amount and currency
        EphemeralKey ephemeralKey = EphemeralKey.create(createParams, requestParams);

        // Send PaymentIntent details to client
        return gson.toJson(new CreateCardKeyResponse(ephemeralKey));
      } catch(StripeException e) {
        response.status(400);
        return gson.toJson(new FailureResponse(e.getMessage()));
      } catch(Exception e) {
        response.status(500);
        return gson.toJson(e);
      }
    });
  }
}
