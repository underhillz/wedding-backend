export default async function handler(req, res) {
  // Handle CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // Fetch from Airtable
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      },
    });

    const data = await response.json();

    const items = data.records.map((r) => ({
      id: r.id,
      name: r.fields.Name,
      image: r.fields.Image?.[0]?.url || "",
      priceDisplay: r.fields.PriceDisplay,
      description: r.fields.Description,
      stripePriceId: r.fields.StripePriceId,
      purchased: r.fields.Purchased || false,
    }));

    res.status(200).json(items);

  } catch (err) {
    console.error("Error fetching registry:", err);
    res.status(500).json({ error: "Failed to load registry" });
  }
}
