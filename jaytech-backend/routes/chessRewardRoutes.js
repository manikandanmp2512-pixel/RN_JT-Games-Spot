const express = require("express");
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/chessRewardController");

const router = express.Router();

router.get("/modes", controller.getModes);

router.get("/balance", auth, controller.getBalance);

router.get("/history", auth, controller.getHistory);

module.exports = router;