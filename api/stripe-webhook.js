import Stripe from "stripe";
import { buffer } from "micro";

// Required for Stripe to verify the signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process ONLY completed checkout sessions
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const recordId = session.metadata?.recordId;
    const priceId = session.metadata?.priceId;

    console.log("🎉 Checkout complete for:", { recordId, priceId });

    if (!recordId) {
      console.error("⚠️ No recordId in metadata");
      return res.status(200).send("No recordId provided");
    }

    try {
      // Update Airtable (mark item as purchased)
      const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(
        process.env.AIRTABLE_TABLE_NAME
      )}/${recordId}`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Purchased: true,
          },
        }),
      });

      const result = await response.json();

      console.log("✅ Airtable updated:", result);

    } catch (err) {
      console.error("❌ Failed to update Airtable:", err);
      return res.status(500).send("Airtable update failed");
    }
  }

  res.status(200).send("Webhook received");
}
