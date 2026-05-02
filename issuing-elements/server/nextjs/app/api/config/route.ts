import { NextResponse } from "next/server";

export async function GET() {
  // You'll likely store the IDs of issued cards in your database.
  // In this demo, the ID of the card is set in the .env.local file.
  return NextResponse.json({
    cardId: process.env.DEMO_CARD_ID,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
}
