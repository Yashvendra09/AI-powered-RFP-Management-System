const RFP = require("../models/rfp.model");
const Vendor = require("../models/vendor.model");
const Proposal = require("../models/proposal.model");
const { parseRfp } = require("../services/llm.service");
const { sendRfpEmail } = require("../services/email.service");


/**
 * createRfp, getAllRfps, getOneRfp unchanged (kept simple)
 */

async function createRfp(req, res) {
  try {
    const { nl_text, title } = req.body;
    if (!nl_text) return res.status(400).json({ error: "nl_text required" });

    let structured = null;
    let raw_llm_response = null;
    try {
      const out = await parseRfp(nl_text);
      structured = out.structured;
      raw_llm_response = out.raw_llm_response;
    } catch (e) {
      console.error('LLM parse error (controller):', e && e.message ? e.message : e);
    }

    const structuredToSave = structured || { title: title || "Untitled RFP", items: [], notes: "No structured output" };

    const newRfp = await RFP.create({
      title: title || structuredToSave.title || "Untitled RFP",
      description: nl_text,
      structured: structuredToSave
    });

    return res.status(201).json({ rfp: newRfp, parsing: { ok: !!structured, raw: raw_llm_response } });
  } catch (error) {
    console.error("RFP create error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getAllRfps(req, res) {
  try {
    const rfps = await RFP.find().sort({ createdAt: -1 });
    return res.json(rfps);
  } catch (err) {
    console.error('getAllRfps error', err);
    return res.status(500).json({ error: "Error fetching RFPs" });
  }
}

async function getOneRfp(req, res) {
  try {
    const rfp = await RFP.findById(req.params.id);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });
    return res.json(rfp);
  } catch (err) {
    console.error('getOneRfp err', err);
    return res.status(500).json({ error: "Error fetching RFP" });
  }
}

/**
 * POST /api/rfps/:id/send
 * Body: { vendorIds: [string], message?: string }
 *
 * Sends the structured RFP (and NL description) to each vendor email.
 * Returns per-vendor send status + previewUrl (if Ethereal/test).
 */
async function sendRfp(req, res) {
  try {
    const rfpId = req.params.id;
    const { vendorIds, message } = req.body;
    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: "vendorIds (array) is required" });
    }

    const rfp = await RFP.findById(rfpId);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });

    // Fetch vendors
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });
    if (!vendors || vendors.length === 0) return res.status(404).json({ error: "No vendors found for provided ids" });

    // Build email content
    const subject = `RFP: ${rfp.title || "New RFP"}`;
    const rfpText = `RFP: ${rfp.title || ""}\n\nDescription:\n${rfp.description}\n\nStructured (JSON):\n${JSON.stringify(rfp.structured, null, 2)}\n\n${message || ""}`;

    const attachments = [
      {
        filename: `rfp-${rfp._id}.json`,
        content: JSON.stringify(rfp.structured, null, 2),
        contentType: "application/json"
      }
    ];

    const results = [];
    for (const v of vendors) {
      try {
        const to = v.email;
        const html = `<p>Hello ${v.contactPerson || v.name},</p>
<p>Please find our RFP below. Reply with your proposal.</p>
<pre>${JSON.stringify(rfp.structured, null, 2)}</pre>
<p>${message || ""}</p>
<p>Regards,<br/>Procurement Team</p>`;

        const { info, previewUrl } = await sendRfpEmail({
          to,
          subject,
          text: rfpText,
          html,
          attachments
        });

        results.push({
          vendorId: v._id,
          vendorEmail: v.email,
          ok: true,
          messageId: info.messageId || info.message_id || null,
          previewUrl: previewUrl || null
        });
      } catch (err) {
        console.error("Failed to send to vendor", v.email, err);
        results.push({
          vendorId: v._id,
          vendorEmail: v.email,
          ok: false,
          error: err && err.message ? err.message : String(err)
        });
      }
    }

    return res.json({ ok: true, results });
  } catch (err) {
    console.error("sendRfp error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function compareRfp(req, res) {
  try {
    const rfpId = req.params.id;
    if (!rfpId) return res.status(400).json({ error: "rfp id required" });

    const rfp = await RFP.findById(rfpId);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });

    const proposals = await Proposal.find({ rfpId: rfpId }).populate("vendorId");
    if (!proposals || proposals.length === 0) {
      return res.status(200).json({ ok: true, message: "No proposals yet", proposals: [] });
    }

    // Helper extract price from parsed
    function extractPrice(p) {
      if (!p.parsed) return null;
      if (p.parsed.total_price) return Number(p.parsed.total_price);
      // try sum of line_items
      if (Array.isArray(p.parsed.line_items) && p.parsed.line_items.length) {
        let s = 0;
        for (const li of p.parsed.line_items) {
          if (li.total) s += Number(li.total);
          else if (li.qty && li.unit_price) s += Number(li.qty) * Number(li.unit_price);
        }
        return s > 0 ? s : null;
      }
      return null;
    }

    // collect numeric measures
    const measures = proposals.map(p => {
      const price = extractPrice(p);
      const delivery = p.parsed && p.parsed.delivery_days ? Number(p.parsed.delivery_days) : null;
      const warranty = p.parsed && p.parsed.warranty_months ? Number(p.parsed.warranty_months) : null;
      const completeness = (p.parsed && typeof p.parsed.confidence === "number") ? Number(p.parsed.confidence) : (
        p.parsed ? 0.5 : 0.1
      );
      return { id: p._id.toString(), vendorId: p.vendorId ? p.vendorId._id.toString() : null, price, delivery, warranty, completeness, raw: p };
    });

    // compute min price and max values for normalization
    const prices = measures.map(m => m.price).filter(x => x != null);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxDelivery = Math.max(...measures.map(m => m.delivery || 0));
    const maxWarranty = Math.max(...measures.map(m => m.warranty || 0));

    // scoring weights (documented in README)
    const weights = { price: 0.4, delivery: 0.25, warranty: 0.15, completeness: 0.2 };

    const scored = measures.map(m => {
      // price score: lower is better -> normalized 0-100
      let priceScore = 0;
      if (m.price != null && minPrice != null && m.price > 0) {
        priceScore = Math.min(100, (minPrice / m.price) * 100);
      } else {
        priceScore = 0;
      }

      // delivery score: fewer days better
      let deliveryScore = 0;
      if (m.delivery != null && maxDelivery > 0) {
        deliveryScore = Math.max(0, (1 - (m.delivery / (maxDelivery || 1))) * 100);
      } else {
        deliveryScore = 50; // neutral if unknown
      }

      // warranty score: more months better
      let warrantyScore = 0;
      if (m.warranty != null && maxWarranty > 0) {
        warrantyScore = Math.min(100, (m.warranty / (maxWarranty || 1)) * 100);
      } else {
        warrantyScore = 50; // neutral
      }

      // completeness score: use confidence 0-1 -> convert to 0-100
      const completenessScore = Math.min(100, Math.max(0, (m.completeness || 0) * 100));

      // final score
      const finalScore = Math.round(
        priceScore * weights.price +
        deliveryScore * weights.delivery +
        warrantyScore * weights.warranty +
        completenessScore * weights.completeness
      );

      return {
        proposalId: m.id,
        vendorId: m.vendorId,
        vendorName: (m.raw && m.raw.vendorId && m.raw.vendorId.name) ? m.raw.vendorId.name : null,
        price: m.price,
        delivery_days: m.delivery,
        warranty_months: m.warranty,
        completeness: m.completeness,
        score_components: {
          priceScore: Math.round(priceScore),
          deliveryScore: Math.round(deliveryScore),
          warrantyScore: Math.round(warrantyScore),
          completenessScore: Math.round(completenessScore)
        },
        finalScore
      };
    });

    // find top recommended vendor(s)
    const sorted = [...scored].sort((a,b) => b.finalScore - a.finalScore);
    const recommended = sorted[0];

    // Optionally ask Groq to produce a short explanation
    let aiExplanation = null;
    try {
      const GROQ_KEY = process.env.GROQ_API_KEY;
      if (GROQ_KEY) {
        const axios = require("axios");
        const prompt = buildComparisonPrompt(rfp, scored, weights, recommended);
        const resp = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0
          },
          { headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" }, timeout: 20000 }
        );
        aiExplanation = resp?.data?.choices?.[0]?.message?.content ?? null;
      }
    } catch (err) {
      console.error("Comparison AI explanation failed:", err && err.message ? err.message : err);
    }

    return res.json({ ok: true, rfpId, recommendations: sorted, recommended: recommended || null, aiExplanation });
  } catch (err) {
    console.error("compareRfp error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/** helper: build LLM prompt summarizing comparisons */
function buildComparisonPrompt(rfp, scored, weights, recommended) {
  const lines = [];
  lines.push(`You are an assistant that explains procurement comparisons.`);
  lines.push(`RFP title: ${rfp.title || ''}`);
  lines.push(`RFP structured: ${JSON.stringify(rfp.structured || {})}`);
  lines.push(`Scoring weights (price, delivery, warranty, completeness): ${JSON.stringify(weights)}`);
  lines.push(`Proposals:`);
  for (const s of scored) {
    lines.push(`- Vendor: ${s.vendorName || s.vendorId}, price: ${s.price}, delivery_days: ${s.delivery_days}, warranty_months: ${s.warranty_months}, completeness: ${s.completeness}, finalScore: ${s.finalScore}`);
  }
  lines.push(`Question: Based on the numeric scores above, recommend the best vendor and explain concisely (3-4 sentences) why. Also call out any major risks or missing information.`);
  return lines.join("\n");
}


module.exports = {
  createRfp,
  getAllRfps,
  getOneRfp,
  sendRfp,
  compareRfp
};
