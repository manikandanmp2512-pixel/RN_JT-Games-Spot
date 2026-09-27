const router = require("express").Router();
const auth = require("../controllers/authController");
router.post("/register", auth.register);
router.post("/verify-register-otp", auth.verifyRegisterOtp);
router.post("/login", auth.login);
router.post("/forgot-password/send-otp", auth.sendForgotOtp);
router.post("/forgot-password/verify-otp", auth.verifyForgotOtp);
router.post("/forgot-password/reset", auth.resetPassword);
module.exports = router;
