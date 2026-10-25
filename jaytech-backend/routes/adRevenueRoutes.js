const express = require("express");
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/adRevenueController");

const router = express.Router();

router.get("/summary", auth, controller.getRevenueSummary);

module.exports = router;