const mongoose = require('mongoose');
const { Schema } = mongoose;

const RfpSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  structured: { type: Schema.Types.Mixed } // LLM output / structured JSON
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('RFP', RfpSchema);
