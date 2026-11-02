const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/verify-register-otp", authController.verifySmsOtp);

router.post("/login", authController.login);

router.post("/forgot-password", authController.sendForgotOtp);
router.post("/verify-forgot-otp", authController.verifyForgotOtp);
router.post("/reset-password", authController.resetPassword);

module.exports = router;