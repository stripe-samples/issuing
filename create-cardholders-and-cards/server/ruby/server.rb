# frozen_string_literal: true

require 'stripe'
require 'sinatra'
require 'dotenv'

# Replace if using a different env file or config
Dotenv.load

# For sample support and debugging, not required for production:
Stripe.set_app_info(
  'stripe-samples/issuing/create-cardholders-and-cards',
  version: '0.0.1',
  url: 'https://github.com/stripe-samples'
)
Stripe.api_version = '2020-08-27'
Stripe.api_key = ENV['STRIPE_SECRET_KEY']

set :static, true
set :public_folder, File.join(File.dirname(__FILE__), ENV['STATIC_DIR'])
set :port, 4242

get '/' do
  content_type 'text/html'
  send_file File.join(settings.public_folder, 'index.html')
end

post '/create-cardholder' do
  content_type 'application/json'
  params = JSON.parse(request.body.read, symbolize_names: true)

  # Create a Cardholder.
  #
  # See the documentation [0] for the full list of supported parameters.
  #
  # [0] https://stripe.com/docs/api/issuing/cardholders/create
  begin
    cardholder = Stripe::Issuing::Cardholder.create(
      name: params[:name],
      email: params[:email],
      phone_number: params[:phone_number],
      status: 'active',
      type: 'individual',
      billing: {
        address: {
          line1: params[:line1],
          city: params[:city],
          state: params[:state],
          postal_code: params[:postal_code],
          country: params[:country],
        },
      },
    )
    cardholder.to_json
  rescue => e
    status 400
    { error: { message: e.message } }.to_json
  end
end

post '/create-card' do
  content_type 'application/json'
  params = JSON.parse(request.body.read, symbolize_names: true)

  # Create a Card.
  #
  # See the documentation [0] for the full list of supported parameters.
  #
  # [0] https://stripe.com/docs/api/issuing/cards/create
  begin
    card = Stripe::Issuing::Card.create(
      type: 'virtual',
      status: params[:status] ? 'active' : 'inactive',
      cardholder: params[:cardholder],
      currency: params[:currency],

      # Include shipping address for physical cards:
      # shipping: {
      #   name: params[:name],
      #   address: {
      #     line1: params[:line1],
      #     city: params[:city],
      #     state: params[:state],
      #     postal_code: params[:postal_code],
      #     country: params[:country],
      #   },
      # },
    )
    card.to_json
  rescue => e
    status 400
    { error: { message: e.message } }.to_json
  end
end

get '/cards/:id' do
  #  Retrieve a Card.
  #
  #  See the documentation [0] for the full list of supported parameters.
  #
  #  [0] https://stripe.com/docs/api/issuing/cards/retrieve
  begin
    card = Stripe::Issuing::Card.retrieve(params[:id])
    card.to_json
  rescue => e
    status 400
    { error: { message: e.message } }.to_json
  end
end

post '/webhook' do
  # You can use webhooks to receive information about asynchronous payment events.
  # For more about our webhook events check out https://stripe.com/docs/webhooks.
  webhook_secret = ENV['STRIPE_WEBHOOK_SECRET']
  payload = request.body.read
  if !webhook_secret.empty?
    # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, webhook_secret
      )
    rescue JSON::ParserError => e
      # Invalid payload
      status 400
      return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      puts '⚠️  Webhook signature verification failed.'
      status 400
      return
    end
  else
    data = JSON.parse(payload, symbolize_names: true)
    event = Stripe::Event.construct_from(data)
  end

  case event.type
  when 'some.event'
    puts '🔔  Webhook received!'
  end

  content_type 'application/json'
  {
    status: 'success'
  }.to_json
end
