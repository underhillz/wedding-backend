import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { priceId, recordId } = req.body;

  if (!priceId || !recordId) {
    return res.status(400).json({ error: "Missing priceId or recordId" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.WEB_URL}/registry-success?item=${recordId}`,
      cancel_url: `${process.env.WEB_URL}/registry?canceled=1`,
      metadata: {
        airtableRecordId: recordId,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
}
