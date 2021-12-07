# frozen_string_literal: true

require 'sinatra'
require 'stripe'
require 'dotenv'

set :port, 4242

Dotenv.load
Stripe.api_key = ENV['STRIPE_SECRET_KEY']
Stripe.api_version = ENV['STRIPE_API_VERSION']

webhook_secret = ENV['STRIPE_WEBHOOK_SECRET']

post '/webhook' do
  payload = request.body.read
  sig_header = request.env['HTTP_STRIPE_SIGNATURE']

  event = nil

  # Verify webhook signature and extract the event.
  begin
    event = Stripe::Webhook.construct_event(
      payload, sig_header, webhook_secret
    )
  rescue JSON::ParserError
    # Invalid payload.
    status 400
    return
  rescue Stripe::SignatureVerificationError
    # Invalid signature.
    status 400
    return
  end

  if event['type'] == 'issuing_authorization.request'
    auth = event['data']['object']
    handle_authorization(auth)
  end

  status 200
end

def handle_authorization(auth)
  # Authorize the transaction.
  Stripe::Issuing::Authorization.approve(auth['id'])
end
