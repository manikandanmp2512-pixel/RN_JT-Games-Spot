const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

// REGISTER

router.post("/register", authController.register);

// VERIFY EMAIL + MOBILE OTP

router.post("/verify-register-otp", authController.verifyRegisterOtp);

// LOGIN

router.post("/login", authController.login);

// FORGOT PASSWORD

router.post("/forgot-password", authController.sendForgotOtp);

router.post("/verify-forgot-otp", authController.verifyForgotOtp);

router.post("/reset-password", authController.resetPassword);

module.exports = router;