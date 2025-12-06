const Vendor = require("../models/vendor.model");
const Proposal = require("../models/proposal.model");
const RFP = require("../models/rfp.model");
const { parseProposalText } = require("../services/llm.service");

/**
 * POST /api/inbound/email
 * Accepts JSON:
 * {
 *   "from": "vendor@example.com",
 *   "subject": "Re: RFP 692efadb88f77dcbabcb4e69",
 *   "body": "We can supply 20 laptops at $1200 each ... delivery 25 days ...",
 *   "rfpId": "<optional rfp id>",
 *   "attachments": [ { "filename":"quote.pdf", "text":"extracted text" } ]
 * }
 */
async function receiveEmail(req, res) {
  try {
    const { from, subject, body, rfpId, attachments } = req.body;
    if (!from || !body) return res.status(400).json({ error: "from and body required" });

    // find or create vendor
    let vendor = await Vendor.findOne({ email: from.toLowerCase() });
    if (!vendor) {
      vendor = await Vendor.create({ name: from.split("@")[0], email: from.toLowerCase() });
    }

    // determine rfpId: prefer explicit rfpId, else try to extract from subject (naive)
    let linkedRfpId = rfpId;
    if (!linkedRfpId && subject) {
      const m = subject.match(/([0-9a-fA-F]{24})/); // ObjectId 24-hex
      if (m) linkedRfpId = m[1];
    }

    // Compose full text to parse (body + any attachment text)
    let fullText = body;
    if (Array.isArray(attachments)) {
      for (const a of attachments) {
        if (a.text) fullText += "\n\n" + a.text;
      }
    }

    // Call LLM parser for proposals (returns structured parsed object)
    const parseOut = await parseProposalText(fullText);

    // Build Proposal doc
    const proposalDoc = {
      rfpId: linkedRfpId || null,
      vendorId: vendor._id,
      vendorEmail: vendor.email,
      subject,
      rawEmail: body,
      parsed: parseOut.parsed || null,
      aiSummary: parseOut.summary || null,
      completeness: parseOut.completeness || null
    };

    const saved = await Proposal.create(proposalDoc);

    return res.status(201).json({ ok: true, proposal: saved, parseMeta: parseOut });
  } catch (err) {
    console.error("Inbound email error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { receiveEmail };
