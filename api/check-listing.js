export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ active: false, inferredStatus: null });
    }

    const html = await response.text();
    const lower = html.toLowerCase();

    // Check for explicit "no longer available" signals first
    const gonePatterns = [
      "listing is no longer available",
      "property is no longer available",
      "this listing has expired",
      "listing not found",
      "property not found",
      "page not found",
      "no longer on the market",
    ];
    if (gonePatterns.some(p => lower.includes(p))) {
      return res.json({ active: false, inferredStatus: null });
    }

    // Check for sold signals
    const soldPatterns = [
      "status: sold",
      "property sold",
      "this home has been sold",
      "sale completed",
      "sold subject to contract",
      "sold stc",
    ];
    if (soldPatterns.some(p => lower.includes(p))) {
      return res.json({ active: true, inferredStatus: "sold" });
    }

    // Check for pending/under offer signals
    const pendingPatterns = [
      "under contract",
      "sale agreed",
      "under offer",
      "status: pending",
      "offer accepted",
      "sale pending",
    ];
    if (pendingPatterns.some(p => lower.includes(p))) {
      return res.json({ active: true, inferredStatus: "pending" });
    }

    return res.json({ active: true, inferredStatus: null });
  } catch {
    return res.json({ active: false, inferredStatus: null });
  }
}
