const crypto = require("crypto");
const { sendSms, normalizeE164 } = require("./sendSms");

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");

const sendMobileOtp = async ({ mobile, otp, purpose = "verification" }) => {
  const to = normalizeE164(mobile);
  const label = purpose === "registration"
    ? "registration"
    : purpose === "forgot-password"
      ? "password reset"
      : "verification";
  const body =
    `Your Jay Tech ${label} OTP is ${otp}. It expires in 10 minutes. ` +
    "Do not share this code with anyone.";
  return sendSms({ to, body });
};

module.exports = { generateOtp, hashOtp, sendMobileOtp, normalizeE164 };
