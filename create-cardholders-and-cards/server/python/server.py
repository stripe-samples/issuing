#! /usr/bin/env python3.6
import stripe
import json
import os

from flask import Flask, render_template, jsonify, request, send_from_directory
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# For sample support and debugging, not required for production:
stripe.set_app_info(
    'stripe-samples/issuing/create-cardholders-and-cards',
    version='0.0.1',
    url='https://github.com/stripe-samples')

stripe.api_version = '2020-08-27'
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

static_dir = str(os.path.abspath(os.path.join(__file__ , "..", os.getenv("STATIC_DIR"))))
app = Flask(__name__, static_folder=static_dir, static_url_path="", template_folder=static_dir)

@app.route('/', methods=['GET'])
def get_root():
    return render_template('index.html')


@app.route('/create-cardholder', methods=['POST'])
def create_cardholder():
    data = json.loads(request.data)

    # Create a Cardholder.
    #
    # See the documentation [0] for the full list of supported parameters.
    #
    # [0] https://stripe.com/docs/api/issuing/cardholders/create
    try:
        cardholder = stripe.issuing.Cardholder.create(
            status='active',
            type='individual',
            name=data['name'],
            email=data['email'],
            phone_number=data['phone_number'],
            billing={
                "address": {
                    "line1": data['line1'],
                    "city": data['city'],
                    "state": data['state'],
                    "country": data['country'],
                    "postal_code": data['postal_code'],
                },
            })

        return jsonify(cardholder)
    except stripe.error.StripeError as e:
        return jsonify({'error': {'message': str(e)}}), 400
    except Exception as e:
        return jsonify({'error': {'message': str(e)}}), 400


@app.route('/create-card', methods=['POST'])
def create_card():
    data = json.loads(request.data)

    # Create a Card.
    #
    # See the documentation [0] for the full list of supported parameters.
    #
    # [0] https://stripe.com/docs/api/issuing/cards/create
    try:
        status = 'inactive' if data['status'] == None else 'active'
        card = stripe.issuing.Card.create(
            cardholder=data['cardholder'],
            currency=data['currency'],
            type='virtual',
            status=status,

            # Include shipping address for physical cards:
            # shipping={
            #     "address": {
            #         "line1": data['line1'],
            #         "city": data['city'],
            #         "state": data['state'],
            #         "country": data['country'],
            #         "postal_code": data['postal_code'],
            #     },
            # }
            )

        return jsonify(card)
    except stripe.error.StripeError as e:
        return jsonify({'error': {'message': str(e)}}), 400
    except Exception as e:
        return jsonify({'error': {'message': str(e)}}), 400


@app.route('/webhook', methods=['POST'])
def webhook_received():
    # You can use webhooks to receive information about asynchronous payment events.
    # For more about our webhook events check out https://stripe.com/docs/webhooks.
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    request_data = json.loads(request.data)

    if webhook_secret:
        # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
        signature = request.headers.get('stripe-signature')
        try:
            event = stripe.Webhook.construct_event(
                payload=request.data, sig_header=signature, secret=webhook_secret)
            data = event['data']
        except Exception as e:
            return e
        # Get the type of webhook event sent - used to check the status of PaymentIntents.
        event_type = event['type']
    else:
        data = request_data['data']
        event_type = request_data['type']
    data_object = data['object']

    if event_type == 'issuing_cardholder.created':
        print('Cardholder created!')
    elif event_type == 'issuing_card.created':
        print('Card created!')

    return jsonify({'status': 'success'})


if __name__ == '__main__':
    app.run(port=4242, debug=True)
