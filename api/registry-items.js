const items = data.records.map((r) => ({
  id: r.id,
  name: r.fields.Name,
  image: r.fields.Image?.[0]?.url || "",
  priceDisplay: r.fields.PriceDisplay,
  description: r.fields.Description,
  stripePriceId: r.fields.StripePriceId,
  purchased: r.fields.Purchased || false,
}));

res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
  res.status(200).end();
  return;
}

res.status(200).json(items);
