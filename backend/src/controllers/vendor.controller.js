const Vendor = require("../models/vendor.model");

/** POST /api/vendors
 * Body: { name, email, contactPerson?, metadata? }
 */
async function createVendor(req, res) {
  try {
    const { name, email, contactPerson, metadata } = req.body;
    if (!name || !email) return res.status(400).json({ error: "name and email required" });

    // upsert-like behavior to avoid duplicate by email
    let vendor = await Vendor.findOne({ email });
    if (vendor) {
      vendor.name = name;
      vendor.contactPerson = contactPerson || vendor.contactPerson;
      vendor.metadata = metadata || vendor.metadata;
      await vendor.save();
      return res.status(200).json(vendor);
    }

    vendor = await Vendor.create({ name, email, contactPerson, metadata });
    return res.status(201).json(vendor);
  } catch (err) {
    console.error("createVendor error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/** GET /api/vendors */
async function listVendors(req, res) {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    return res.json(vendors);
  } catch (err) {
    console.error("listVendors error:", err);
    return res.status(500).json({ error: "Error fetching vendors" });
  }
}

/** GET /api/vendors/:id */
async function getVendor(req, res) {
  try {
    const v = await Vendor.findById(req.params.id);
    if (!v) return res.status(404).json({ error: "Vendor not found" });
    return res.json(v);
  } catch (err) {
    console.error("getVendor error:", err);
    return res.status(500).json({ error: "Error fetching vendor" });
  }
}

/** DELETE /api/vendors/:id */
async function deleteVendor(req, res) {
  try {
    const v = await Vendor.findByIdAndDelete(req.params.id);
    if (!v) return res.status(404).json({ error: "Vendor not found" });
    return res.json({ ok: true, deletedId: req.params.id });
  } catch (err) {
    console.error("deleteVendor error:", err);
    return res.status(500).json({ error: "Error deleting vendor" });
  }
}

module.exports = { createVendor, listVendors, getVendor, deleteVendor };
