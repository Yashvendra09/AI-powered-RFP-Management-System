const axios = require("axios");

/** safeJsonParse */
function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

/** build prompt for RFP */
function buildRfpPrompt(txt) {
  return `You are an assistant that MUST output ONLY valid JSON (no explanation).
Input natural language RFP request:
"""${txt}"""

Extract and return a JSON object with these keys:
- title (string)
- items: array of { name, qty (int), spec (string|nullable) }
- budget_total (number|null)
- delivery_days (int|null)
- payment_terms (string|null)
- warranty_months (int|null)
- notes (string|null)

Return only JSON.`;
}

/** parseRfp: use Groq if available, otherwise fallback */
async function parseRfp(nl_text) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const prompt = buildRfpPrompt(nl_text);

  if (GROQ_KEY) {
    try {
      const resp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0
        },
        { headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" }, timeout: 20000 }
      );

      const llmText = resp?.data?.choices?.[0]?.message?.content ?? JSON.stringify(resp.data);
      // try parse JSON
      let structured = safeJsonParse(llmText);
      if (!structured) {
        const m = llmText.match(/\{[\s\S]*\}/);
        structured = m ? safeJsonParse(m[0]) : null;
      }
      return { structured, raw_llm_response: llmText };
    } catch (err) {
      console.error("Groq call failed in parseRfp:", err && err.message ? err.message : err);
      // fallthrough to fallback
    }
  }

  // fallback parser (simple heuristics)
  const text = nl_text || "";
  let budget = null;
  const b = text.match(/(?:\$|USD\s*)\s*([0-9\.,]{2,})/i);
  if (b) budget = Number(b[1].replace(/[, ]/g, ""));

  let delivery_days = null;
  const d = text.match(/(\d{1,3})\s*(?:days|day)/i);
  if (d) delivery_days = parseInt(d[1], 10);

  let warranty_months = null;
  const ym = text.match(/(\d{1,2})\s*(?:year|years)/i);
  if (ym) warranty_months = parseInt(ym[1], 10) * 12;
  const wm = text.match(/(\d{1,3})\s*(?:months|month)/i);
  if (wm) warranty_months = parseInt(wm[1], 10);

  const items = [];
  const ip = [
    { key: 'Laptop', re: /(\d{1,4})\s*(?:laptops?|notebooks?)/i },
    { key: 'Monitor', re: /(\d{1,4})\s*(?:monitors?)/i },
  ];
  for (const p of ip) {
    const m = text.match(p.re);
    if (m) {
      const specMatch = text.match(/(\d+\s*GB|\d+\s*GB RAM|\d+\s*inch|[0-9]+-inch)/i);
      items.push({ name: p.key, qty: parseInt(m[1], 10), spec: specMatch ? specMatch[0] : null });
    }
  }

  return {
    structured: {
      title: text.split(/[.\n]/)[0].slice(0, 120),
      items,
      budget_total: budget,
      delivery_days,
      payment_terms: null,
      warranty_months,
      notes: null
    },
    raw_llm_response: null
  };
}

/** parseProposalText: extracts proposal info from vendor reply */
async function parseProposalText(text) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const prompt = `You are a parser that must extract a vendor proposal into valid JSON.
Input proposal text:
"""${text}"""

Return ONLY JSON with keys:
- line_items: [{ description, qty (int|null), unit_price (number|null), total (number|null), currency }]
- total_price (number|null)
- currency (string|null)
- delivery_days (int|null)
- warranty_months (int|null)
- payment_terms (string|null)
- notes (string|null)
- confidence (0-1)

Return JSON only.`;

  if (GROQ_KEY) {
    try {
      const resp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0
        },
        { headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" }, timeout: 20000 }
      );

      const llmText = resp?.data?.choices?.[0]?.message?.content ?? JSON.stringify(resp.data);
      const jsonMatch = llmText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? safeJsonParse(jsonMatch[0]) : null;
      const summary = llmText.replace(jsonMatch ? jsonMatch[0] : "", "").trim();
      return { parsed, summary: summary || null, completeness: parsed ? 1.0 : 0.0, raw: llmText };
    } catch (err) {
      console.error("Groq parseProposalText failed:", err && err.message ? err.message : err);
      // fall through to fallback
    }
  }

  // fallback simple parse
  const parsedFallback = { line_items: [], total_price: null, currency: null, delivery_days: null, warranty_months: null, payment_terms: null, notes: null, confidence: 0.2 };
  const tot = text.match(/(?:total\s*[:=]?\s*\$?\s*([0-9\.,]{3,}))/i) || text.match(/\$\s*([0-9\.,]{3,})/);
  if (tot) parsedFallback.total_price = Number(tot[1].replace(/[, ]/g, "")), parsedFallback.currency = "$";
  const d = text.match(/(\d{1,3})\s*(?:days|day)/i);
  if (d) parsedFallback.delivery_days = parseInt(d[1], 10);
  const w = text.match(/(\d{1,2})\s*(?:year|years)/i);
  if (w) parsedFallback.warranty_months = parseInt(w[1], 10) * 12;

  const lines = text.split(/\n/);
  for (const ln of lines) {
    const m = ln.match(/(\d{1,4})\s*(?:x|\b)\s*([a-zA-Z\-\s]{3,60})\s*(?:at|@|for)?\s*\$?([0-9\.,]{2,})/i);
    if (m) {
      parsedFallback.line_items.push({ description: m[2].trim(), qty: parseInt(m[1], 10), unit_price: Number(m[3].replace(/[, ]/g, "")), total: null, currency: "$" });
    }
  }

  return { parsed: parsedFallback, summary: null, completeness: 0.2, raw: null };
}

module.exports = {
  parseRfp,
  parseProposalText
};
