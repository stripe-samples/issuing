import stripe
import json
import os

from flask import (
  Flask,
  request,
)

from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

app = Flask(__name__, static_folder=".", static_url_path="", template_folder=".")

# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Uncomment and replace with a real secret. You can find your endpoint's
# secret in your webhook settings.
webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

@app.route("/webhook", methods=["POST"])
def webhook_received():
  signature = request.headers.get("stripe-signature")

  # Verify webhook signature and extract the event.
  try:
    event = stripe.Webhook.construct_event(
      payload=request.data, sig_header=signature, secret=webhook_secret
    )
  except ValueError as e:
    # Invalid payload.
    return json.dumps({'error': {'message': str(e)}}), 400
  except stripe.error.SignatureVerificationError as e:
    # Invalid signature
    return json.dumps({'error': {'message': str(e)}}), 400

  if event["type"] == "issuing_authorization.request":
    auth = event["data"]["object"]
    handle_authorization(auth)

  return json.dumps({"success": True}), 200

def handle_authorization(auth):
  # Authorize the transaction.
  stripe.issuing.Authorization.approve(auth['id'])

if __name__ == "__main__":
  app.run(port=4242)
