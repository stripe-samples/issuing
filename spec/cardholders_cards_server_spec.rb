require_relative './spec_helper.rb'

RSpec.describe "Create cardholders and cards integration" do
  it "serves the index route" do
    # Get the index html page
    response = get("/")
    expect(response).not_to be_nil
  end

  it "Creates a cardholder" do
    old_latest_cardholder = Stripe::Issuing::Cardholder.list(limit: 1).data.first
    resp, status = post_json('/create-cardholder', {
      name: 'Jenny Rosen',
      email: 'jenny.rosen@example.com',
      phone_number: '3218675301',
      line1: '510 Townsend',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94111',
      country: 'US'
    })
    expect(status).to eq(200)
    expect(resp).to have_key("id")

    latest_cardholder = Stripe::Issuing::Cardholder.list(limit: 1).data.first
    expect(resp["id"]).to eq(latest_cardholder.id)
    expect(old_latest_cardholder.id).not_to eq(latest_cardholder.id)
  end

  it "Returns error message for incomplete cardholder form" do
    old_latest_cardholder = Stripe::Issuing::Cardholder.list(limit: 1).data.first
    resp, status = post_json('/create-cardholder', {
      name: 'Jenny Rosen',
      email: 'jenny.rosen@example.com',
    })
    expect(status).to eq(400)
    expect(resp).to have_key("error")
    expect(resp["error"]).to have_key("message")

    latest_cardholder = Stripe::Issuing::Cardholder.list(limit: 1).data.first
    expect(old_latest_cardholder.id).to eq(latest_cardholder.id)
  end

  it "Creates a card" do
    cardholder = Stripe::Issuing::Cardholder.list(limit: 1).data.first
    resp, status = post_json('/create-card', {
      cardholder: cardholder.id,
      currency: 'usd',
      status: true,
      name: 'Jenny Rosen',
      line1: '510 Townsend',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94111',
      country: 'US'
    })

    expect(status).to eq(200)

    latest_card = Stripe::Issuing::Card.list(limit: 1).data.first
    expect(resp).to have_key("id")
    expect(resp["id"]).to eq(latest_card.id)
  end

  it "Returns error message for incomplete card form" do
    old_latest_card = Stripe::Issuing::Card.list(limit: 1).data.first
    resp, status = post_json('/create-card', {
      name: 'Jenny Rosen',
    })
    expect(status).to eq(400)
    expect(resp).to have_key("error")
    expect(resp["error"]).to have_key("message")

    latest_card = Stripe::Issuing::Card.list(limit: 1).data.first
    expect(old_latest_card.id).to eq(latest_card.id)
  end
end
