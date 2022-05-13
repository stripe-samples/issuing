# frozen_string_literal: true
require 'stripe'
require 'sinatra'
require 'sinatra/reloader'
require 'dotenv'

# Replace if using a different env file or config
Dotenv.load

# For sample support and debugging, not required for production:
Stripe.set_app_info(
  'stripe-samples/issuing/issuing-elements',
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

get '/config' do
  content_type 'application/json'
  {
    # You'll likely store the IDs of issued cards in your
    # database in this demo the ID of the card is set in the
    # .env file.
    cardId: ENV['DEMO_CARD_ID'],
    publishableKey: ENV['STRIPE_PUBLISHABLE_KEY'],
  }.to_json
end

post '/create-card-key' do
  content_type 'application/json'
  data = JSON.parse(request.body.read)

  ephemeral_key = Stripe::EphemeralKey.create({
    issuing_card: data['cardId'],
    nonce: data['nonce'],
  }, {
    stripe_version: data['apiVersion']
  })

  { ephemeralKey: ephemeral_key }.to_json
end
