/**
 * parseProposalText(text)
 * - Calls the configured Groq LLM to parse vendor proposal text into structured proposal fields.
 * - If GROQ_API_KEY missing or LLM call fails, returns a best-effort fallback extraction.
 *
 * Returns: { parsed: {...}, summary: "text", completeness: 0.0 }
 */
async function parseProposalText(text) {
  const GROQ_KEY = process.env.GROQ_API_KEY;

  const prompt = `You are a parser that must extract a vendor proposal into valid JSON.
Input proposal text:
"""${text}"""

Return ONLY JSON with keys:
- line_items: [{ description, qty (int|nullable), unit_price (number|null), total (number|null), currency }]
- total_price (number|null)
- currency (string|null)
- delivery_days (int|null)
- warranty_months (int|null)
- payment_terms (string|null)
- notes (string|null)
- confidence (0-1)
Also return a short one-sentence summary string after the JSON, separated by a newline.`;

  // If Groq available, call it
  if (GROQ_KEY) {
    try {
      const resp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0
        },
        { headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" } }
      );

      const llmText = resp.data?.choices?.[0]?.message?.content ?? resp.data?.choices?.[0]?.text ?? JSON.stringify(resp.data);
      // Try extract JSON object from beginning
      const jsonMatch = llmText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? safeJsonParse(jsonMatch[0]) : null;
      const summaryMatch = llmText.replace(jsonMatch ? jsonMatch[0] : "", "").trim();
      return { parsed, summary: summaryMatch || null, completeness: parsed ? 1.0 : 0.0, raw: llmText };
    } catch (err) {
      console.error("Groq parseProposalText failed:", err && err.message ? err.message : err);
      // fall through to local fallback
    }
  }

  // Simple fallback: try extracting lines like "20 x Laptop @ $1200 = $24000"
  const parsedFallback = { line_items: [], total_price: null, currency: null, delivery_days: null, warranty_months: null, payment_terms: null, notes: null, confidence: 0.3 };

  // extract totals like $24000 or 24000
  const tot = text.match(/(?:total\s*[:=]?\s*\$?\s*([0-9\.,]{3,}))/i) || text.match(/\$\s*([0-9\.,]{3,})/);
  if (tot) {
    parsedFallback.total_price = Number(tot[1].replace(/[, ]/g, ""));
    parsedFallback.currency = "$";
  }

  // delivery days
  const d = text.match(/(\d{1,3})\s*(?:days|day)/i);
  if (d) parsedFallback.delivery_days = parseInt(d[1], 10);

  // warranty
  const w = text.match(/(\d{1,2})\s*(?:year|years)/i);
  if (w) parsedFallback.warranty_months = parseInt(w[1], 10) * 12;

  // find simple line items like "20 laptops at $1200"
  const lines = text.split(/\n/);
  for (const ln of lines) {
    const m = ln.match(/(\d{1,4})\s*(?:x|\b)\s*([a-zA-Z\-\s]{3,60})\s*(?:at|@|for)?\s*\$?([0-9\.,]{2,})/i);
    if (m) {
      parsedFallback.line_items.push({
        description: m[2].trim(),
        qty: parseInt(m[1], 10),
        unit_price: Number(m[3].replace(/[, ]/g, "")),
        total: null,
        currency: "$"
      });
    }
  }

  return { parsed: parsedFallback, summary: null, completeness: 0.3, raw: null };
}

module.exports.parseProposalText = parseProposalText;
