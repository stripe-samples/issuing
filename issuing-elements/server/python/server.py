#! /usr/bin/env python3.6
import stripe
import json
import os

from flask import Flask, render_template, jsonify, request, send_from_directory
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# For sample support and debugging, not required for production:
stripe.set_app_info(
    'stripe-samples/issuing/issuing-element',
    version='0.0.1',
    url='https://github.com/stripe-samples')

stripe.api_version = '2020-08-27'
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

static_dir = str(os.path.abspath(os.path.join(__file__ , "..", os.getenv("STATIC_DIR"))))
app = Flask(__name__, static_folder=static_dir, static_url_path="", template_folder=static_dir)

@app.route('/', methods=['GET'])
def get_root():
    return render_template('index.html')


@app.route('/config', methods=['GET'])
def get_config():
    return jsonify({
        'cardId': os.getenv('DEMO_CARD_ID'),
        'publishableKey': os.getenv('STRIPE_PUBLISHABLE_KEY')
    })


@app.route('/create-card-key', methods=['POST'])
def create_payment():
    data = json.loads(request.data)

    try:
        ephemeral_key = stripe.EphemeralKey.create(
            issuing_card=data['cardId'],
            nonce=data['nonce'],
            stripe_version=data['apiVersion']
        )

        # Send PaymentIntent details to the front end.
        return jsonify({'ephemeralKey': ephemeral_key})
    except stripe.error.StripeError as e:
        return jsonify({'error': {'message': str(e)}}), 400
    except Exception as e:
        return jsonify({'error': {'message': str(e)}}), 400


if __name__ == '__main__':
    app.run(port=4242, debug=True)
