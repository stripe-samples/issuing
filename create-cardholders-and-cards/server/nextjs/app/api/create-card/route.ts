import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { cardholder, currency, status } = await req.json();

  // Create a Card.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/issuing/cards/create
  try {
    const card = await stripe.issuing.cards.create({
      cardholder: cardholder,
      currency: currency,
      type: "virtual",
      status: status ? "active" : "inactive",

      // Include shipping address for physical cards:
      // shipping: {
      //   name: name,
      //   address: {
      //     line1: line1,
      //     city: city,
      //     state: state,
      //     postal_code: postal_code,
      //     country: country,
      //   },
      // },
    });

    return NextResponse.json(card);
  } catch (e) {
    const error = e as Error;
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 400 }
    );
  }
}
