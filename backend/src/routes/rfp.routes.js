const express = require("express");
const router = express.Router();
const rfpController = require("../controllers/rfp.controller");

if (typeof rfpController.createRfp !== "function") throw new Error("rfpController.createRfp is not a function");

router.post("/", rfpController.createRfp);
router.get("/", rfpController.getAllRfps);
router.get("/:id", rfpController.getOneRfp);
router.post("/:id/send", rfpController.sendRfp);
router.get("/:id/compare", rfpController.compareRfp);

module.exports = router;
