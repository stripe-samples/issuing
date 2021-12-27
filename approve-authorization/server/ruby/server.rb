# frozen_string_literal: true
# To watch a video explaining real time issuing authorizations, see:
# https://www.youtube.com/watch?v=vKptxR9zdCQ

require 'sinatra'
require 'stripe'
require 'dotenv'

set :port, 4242

# Replace if using a different env file or config
Dotenv.load

# For sample support and debugging, not required for production:
Stripe.set_app_info(
  'stripe-samples/issuing/approve-authorization',
  version: '0.0.1',
  url: 'https://github.com/stripe-samples'
)
Stripe.api_key = ENV['STRIPE_SECRET_KEY']
Stripe.api_version = '2020-08-27'

post '/webhook' do
  webhook_secret = ENV['STRIPE_WEBHOOK_SECRET']
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

  puts "Handling #{event.type}"

  if event.type == 'issuing_authorization.request'
    auth = event.data.object
    # Authorize the transaction.
    Stripe::Issuing::Authorization.approve(auth.id)
  end

  status 200
end
