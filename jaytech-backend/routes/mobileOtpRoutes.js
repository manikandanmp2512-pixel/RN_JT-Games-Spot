
const express = require("express");

const {
  sendMobileOtpController,
  verifyMobileOtpController,
} = require("../controllers/mobileOtpController");

const router = express.Router();

router.post("/send-mobile-otp", sendMobileOtpController);
router.post("/verify-mobile-otp", verifyMobileOtpController);

module.exports = router;
