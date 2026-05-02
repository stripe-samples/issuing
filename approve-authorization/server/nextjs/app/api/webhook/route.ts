import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  let data: Stripe.Event.Data;
  let eventType: string;

  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      data = event.data;
      eventType = event.type;
    } catch (err) {
      const error = err as Error;
      console.log(`Webhook signature verification failed: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const payload = JSON.parse(body);
    data = payload.data;
    eventType = payload.type;
  }

  if (eventType === "issuing_authorization.request") {
    const auth = data.object as Stripe.Issuing.Authorization;
    await handleAuthorizationRequest(auth);
  }

  return NextResponse.json({ received: true });
}

async function handleAuthorizationRequest(
  auth: Stripe.Issuing.Authorization
): Promise<void> {
  // Authorize the transaction.
  await stripe.issuing.authorizations.approve(auth.id);
  console.log(`Approved authorization ${auth.id}`);
}
