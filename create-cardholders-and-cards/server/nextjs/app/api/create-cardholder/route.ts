import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { name, email, phone_number, line1, city, state, postal_code, country } =
    await req.json();

  // Create a Cardholder.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/issuing/cardholders/create
  try {
    const cardholder = await stripe.issuing.cardholders.create({
      status: "active",
      type: "individual",
      name: name,
      email: email,
      phone_number: phone_number,
      billing: {
        address: {
          line1: line1,
          city: city,
          state: state,
          postal_code: postal_code,
          country: country,
        },
      },
    });

    return NextResponse.json(cardholder);
  } catch (e) {
    const error = e as Error;
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 400 }
    );
  }
}
