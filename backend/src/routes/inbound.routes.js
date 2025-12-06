const express = require("express");
const router = express.Router();
const inboundController = require("../controllers/inbound.controller");

// simple health check
router.get("/", (req, res) => res.json({ ok: true, endpoint: "inbound email webhook" }));

router.post("/email", inboundController.receiveEmail);

module.exports = router;
