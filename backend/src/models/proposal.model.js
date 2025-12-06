const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProposalSchema = new Schema({
  rfpId: { type: Schema.Types.ObjectId, ref: "RFP", required: false }, // optional: we try to link if possible
  vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
  vendorEmail: { type: String, required: true },
  subject: { type: String },
  rawEmail: { type: String }, // full raw body
  parsed: { type: Schema.Types.Mixed }, // { line_items, total_price, currency, delivery_days, warranty_months, payment_terms, notes, confidence }
  completeness: { type: Number }, // optional score
  aiSummary: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Proposal", ProposalSchema);
