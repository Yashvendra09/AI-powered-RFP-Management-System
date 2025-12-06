const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendor.controller");

// sanity-check
if (typeof vendorController.createVendor !== "function") throw new Error("vendor controller missing");

router.post("/", vendorController.createVendor);
router.get("/", vendorController.listVendors);
router.get("/:id", vendorController.getVendor);
router.delete("/:id", vendorController.deleteVendor);

module.exports = router;
