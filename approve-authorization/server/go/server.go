package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/stripe/stripe-go/v72"
	"github.com/stripe/stripe-go/v72/issuing/authorization"
	"github.com/stripe/stripe-go/v72/webhook"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Set your secret key. Remember to switch to your live secret key in production!
	// See your keys here: https://dashboard.stripe.com/account/apikeys
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	http.HandleFunc("/webhook", handleWebhook)
	addr := "localhost:4242"

	log.Printf("Listening on %s ...", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

func handleWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	b, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Verify webhook signature and extract the event.
	event, err := webhook.ConstructEvent(b, r.Header.Get("Stripe-Signature"), os.Getenv("STRIPE_WEBHOOK_SECRET"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error verifying webhook signature: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if event.Type == "issuing_authorization.request" {
		var auth stripe.IssuingAuthorization
		err := json.Unmarshal(event.Data.Raw, &auth)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing webhook JSON: %v\n", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		handleAuthorizationRequest(auth)
	}

	w.WriteHeader(http.StatusOK)
}

func handleAuthorizationRequest(auth stripe.IssuingAuthorization) {
	// Authorize the transaction.
	_, _ = authorization.Approve(auth.ID, &stripe.IssuingAuthorizationApproveParams{})
}
