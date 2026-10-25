
const {
  sendMobileOtp,
  verifyMobileOtp,
} = require("../utils/mobileOtpService");

const sendMobileOtpController = async (req, res) => {
  try {
    const mobile = String(req.body.mobile || "").trim();

    const result = await sendMobileOtp(mobile);

    return res.status(200).json(result);
  } catch (error) {
    console.error("MOBILE OTP SEND ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to send mobile OTP",
    });
  }
};

const verifyMobileOtpController = async (req, res) => {
  try {
    const mobile = String(req.body.mobile || "").trim();
    const otp = String(req.body.otp || "").trim();

    const result = await verifyMobileOtp(mobile, otp);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("MOBILE OTP VERIFY ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify mobile OTP",
    });
  }
};

module.exports = {
  sendMobileOtpController,
  verifyMobileOtpController,
};
