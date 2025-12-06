const mongoose = require('mongoose');
const { Schema } = mongoose;

const VendorSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactPerson: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', VendorSchema);