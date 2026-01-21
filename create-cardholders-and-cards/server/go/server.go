package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/stripe/stripe-go/v84"
	"github.com/stripe/stripe-go/v84/issuing/card"
	"github.com/stripe/stripe-go/v84/issuing/cardholder"
	"github.com/stripe/stripe-go/v84/webhook"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	// For sample support and debugging, not required for production:
	stripe.SetAppInfo(&stripe.AppInfo{
		Name:    "stripe-samples/your-sample-name",
		Version: "0.0.1",
		URL:     "https://github.com/stripe-samples",
	})

	http.Handle("/", http.FileServer(http.Dir(os.Getenv("STATIC_DIR"))))
	http.HandleFunc("/create-cardholder", handleCreateCardholder)
	http.HandleFunc("/create-card", handleCreateCard)
	http.HandleFunc("/cards/", handleGetCard)
	http.HandleFunc("/webhook", handleWebhook)

	log.Println("server running at 0.0.0.0:4242")
	http.ListenAndServe("0.0.0.0:4242", nil)
}

// ErrorResponseMessage represents the structure of the error
// object sent in failed responses.
type ErrorResponseMessage struct {
	Message string `json:"message"`
}

// ErrorResponse represents the structure of the error object sent
// in failed responses.
type ErrorResponse struct {
	Error *ErrorResponseMessage `json:"error"`
}

type cardholderCreateReq struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phone_number"`
	Line1       string `json:"line1"`
	City        string `json:"city"`
	State       string `json:"state"`
	PostalCode  string `json:"postal_code"`
	Country     string `json:"country"`
}

type cardCreateReq struct {
	Cardholder string `json:"cardholder"`
	Currency   string `json:"currency"`
	Status     bool   `json:"status"`
}

func handleCreateCardholder(w http.ResponseWriter, r *http.Request) {
	req := cardholderCreateReq{}
	json.NewDecoder(r.Body).Decode(&req)

	params := &stripe.IssuingCardholderParams{
		Status:      stripe.String("active"),
		Type:        stripe.String("individual"),
		Name:        stripe.String(req.Name),
		Email:       stripe.String(req.Email),
		PhoneNumber: stripe.String(req.PhoneNumber),
		Billing: &stripe.IssuingCardholderBillingParams{
			Address: &stripe.AddressParams{
				Line1:      stripe.String(req.Line1),
				City:       stripe.String(req.City),
				State:      stripe.String(req.State),
				PostalCode: stripe.String(req.PostalCode),
				Country:    stripe.String(req.Country),
			},
		},
	}

	ich, err := cardholder.New(params)
	if err != nil {
		// Try to safely cast a generic error to a stripe.Error so that we can get at
		// some additional Stripe-specific information about what went wrong.
		if stripeErr, ok := err.(*stripe.Error); ok {
			fmt.Printf("Other Stripe error occurred: %v\n", stripeErr.Error())
			writeJSONErrorMessage(w, stripeErr.Error(), 400)
		} else {
			fmt.Printf("Other error occurred: %v\n", err.Error())
			writeJSONErrorMessage(w, "Unknown server error", 500)
		}

		return
	}

	writeJSON(w, ich)
}

func handleCreateCard(w http.ResponseWriter, r *http.Request) {
	req := cardCreateReq{}
	json.NewDecoder(r.Body).Decode(&req)

	var status stripe.IssuingCardStatus
	if req.Status {
		status = stripe.IssuingCardStatusActive
	} else {
		status = stripe.IssuingCardStatusInactive
	}

	params := &stripe.IssuingCardParams{
		Cardholder: stripe.String(req.Cardholder),
		Currency:   stripe.String(req.Currency),
		Type:       stripe.String(string(stripe.IssuingCardTypeVirtual)),
		Status:     stripe.String(string(status)),

		// Include shipping address for physical cards.
		// Shipping: &stripe.CardholderShippingParams{
		// 	Address: &stripe.AddressParams{
		// 		Line1: stripe.String(req.Line1),
		// 		City: stripe.String(req.City),
		// 		State: stripe.String(req.State),
		// 		PostalCode: stripe.String(req.PostalCode),
		// 		Country: stripe.String(req.Country),
		// 	}
		// }
	}

	c, err := card.New(params)
	if err != nil {
		// Try to safely cast a generic error to a stripe.Error so that we can get at
		// some additional Stripe-specific information about what went wrong.
		if stripeErr, ok := err.(*stripe.Error); ok {
			fmt.Printf("Other Stripe error occurred: %v\n", stripeErr.Error())
			writeJSONErrorMessage(w, stripeErr.Error(), 400)
		} else {
			fmt.Printf("Other error occurred: %v\n", err.Error())
			writeJSONErrorMessage(w, "Unknown server error", 500)
		}

		return
	}

	writeJSON(w, c)
}

func handleGetCard(w http.ResponseWriter, r *http.Request) {
	card_id := strings.Split(r.URL.Path, "/cards/")[1]

	c, err := card.Get(card_id, nil)
	if err != nil {
		// Try to safely cast a generic error to a stripe.Error so that we can get at
		// some additional Stripe-specific information about what went wrong.
		if stripeErr, ok := err.(*stripe.Error); ok {
			fmt.Printf("Other Stripe error occurred: %v\n", stripeErr.Error())
			writeJSONErrorMessage(w, stripeErr.Error(), 400)
		} else {
			fmt.Printf("Other error occurred: %v\n", err.Error())
			writeJSONErrorMessage(w, "Unknown server error", 500)
		}

		return
	}

	writeJSON(w, c)
}

func handleWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	b, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		log.Printf("ioutil.ReadAll: %v", err)
		return
	}

	event, err := webhook.ConstructEvent(b, r.Header.Get("Stripe-Signature"), os.Getenv("STRIPE_WEBHOOK_SECRET"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		log.Printf("webhook.ConstructEvent: %v", err)
		return
	}

	if event.Type == "checkout.session.completed" {
		fmt.Println("Checkout Session completed!")
	}

	writeJSON(w, nil)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(v); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Printf("json.NewEncoder.Encode: %v", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, &buf); err != nil {
		log.Printf("io.Copy: %v", err)
		return
	}
}

func writeJSONError(w http.ResponseWriter, v interface{}, code int) {
	w.WriteHeader(code)
	writeJSON(w, v)
	return
}

func writeJSONErrorMessage(w http.ResponseWriter, message string, code int) {
	resp := &ErrorResponse{
		Error: &ErrorResponseMessage{
			Message: message,
		},
	}
	writeJSONError(w, resp, code)
}
