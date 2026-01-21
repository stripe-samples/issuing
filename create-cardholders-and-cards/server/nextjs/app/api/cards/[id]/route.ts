import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Retrieve a Card.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/issuing/cards/retrieve
  try {
    const card = await stripe.issuing.cards.retrieve(id, {
      expand: ["cardholder"],
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
