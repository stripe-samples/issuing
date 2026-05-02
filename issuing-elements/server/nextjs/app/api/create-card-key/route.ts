import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { cardId, nonce, apiVersion } = await request.json();

    // Create an ephemeral key for the issuing card
    // If you are using Stripe Issuing with Stripe Connect, you will need to
    // specify the Account ID on the header of the request.
    const ephemeralKey = await stripe.ephemeralKeys.create(
      {
        issuing_card: cardId,
        nonce: nonce,
      },
      {
        apiVersion: apiVersion,
      }
    );

    return NextResponse.json({ ephemeralKey });
  } catch (error) {
    console.error("Error creating ephemeral key:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
