import Stripe from "stripe";

// Disable body parsing so we get the raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const buf = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Stripe signature verification error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const recordId = session.metadata?.recordId;

    console.log("🎉 Successful checkout:", { recordId });

    if (!recordId) {
      console.warn("⚠️ No recordId found in metadata");
      return res.status(200).send("No recordId");
    }

    try {
      // Airtable update
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
      console.error("❌ Airtable update failed:", err.message);
      return res.status(500).send("Airtable update failed");
    }
  }

  res.status(200).send("Webhook received");
}

// Helper to read raw request body
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
