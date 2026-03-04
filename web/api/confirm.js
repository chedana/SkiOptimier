export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Support both new multi-destination format and legacy single-destination format
  let selections;
  const body = req.body || {};
  if (body.selections) {
    selections = body.selections;
  } else if (body.selected_routes?.length) {
    selections = [{ origin: body.origin, resort: body.resort, selected_routes: body.selected_routes }];
  } else {
    return res.status(400).json({ error: "Missing selections or selected_routes" });
  }

  if (selections.length === 0 || !selections.every(s => s.selected_routes?.length)) {
    return res.status(400).json({ error: "Each selection must have selected_routes" });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) return res.status(500).json({ error: "Webhook not configured" });

  // Build message with sections per destination
  const allIds = selections.flatMap(s => s.selected_routes.map(r => r.id)).join(" ");
  const sections = selections.map(s => {
    const ids = s.selected_routes.map(r => r.id).join(", ");
    const lines = s.selected_routes.map(r => `${r.id} ${r.name}`).join("\n");
    return `**${s.origin} → ${s.resort}** — ${ids}\n${lines}`;
  }).join("\n\n");

  const content = `<@1478519063960354948> 确认 ${allIds}\n\n${sections}`;

  try {
    const resp = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        username: "Ski Route Planner ⛷️",
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(502).json({ error: "Discord webhook error", detail: err });
    }

    return res.status(200).json({ ok: true, message: "已发送到 Discord" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
