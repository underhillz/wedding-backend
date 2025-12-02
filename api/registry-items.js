export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Validate env variables
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_NAME;
  const token = process.env.AIRTABLE_TOKEN;

  if (!base || !table || !token) {
    return res.status(500).json({
      error: "Missing Airtable environment variables",
      AIRTABLE_BASE_ID: !!base,
      AIRTABLE_TABLE_NAME: !!table,
      AIRTABLE_TOKEN: !!token
    });
  }

  try {
    const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(500).json({
        error: "Airtable request failed",
        status: response.status,
        statusText: response.statusText,
        url
      });
    }

    const data = await response.json();

    // Transform items
    const items = (data.records || []).map((r) => ({
      id: r.id,
      name: r.fields.Name || "",
      image: r.fields.Image?.[0]?.url || "",
      priceDisplay: r.fields.PriceDisplay || "",
      description: r.fields.Description || "",
      stripePriceId: r.fields.StripePriceId || "",
      purchased: r.fields.Purchased || false,
    }));

    return res.status(200).json(items);

  } catch (err) {
    return res.status(500).json({
      error: "Unexpected error",
      details: err.message
    });
  }
}
