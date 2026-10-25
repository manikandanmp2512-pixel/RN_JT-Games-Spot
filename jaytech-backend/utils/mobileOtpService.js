
const crypto = require("crypto");
const MobileOtp = require("../models/MobileOtp");
const sendSms = require("./sendSms");

const hashOtp = (otp) =>
  crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

const sendMobileOtp = async (mobile) => {
  if (!mobile) {
    throw new Error("Mobile number is required");
  }

  // Expect an international number, e.g. +919876543210
  if (!/^\+[1-9]\d{7,14}$/.test(mobile)) {
    throw new Error(
      "Enter a valid mobile number with country code"
    );
  }

  const otp = crypto
    .randomInt(100000, 1000000)
    .toString();

  await MobileOtp.findOneAndUpdate(
    { mobile },
    {
      $set: {
        otpHash: hashOtp(otp),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      },
    },
    // { upsert: true, new: true, setDefaultsOnInsert: true }
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  try {
    await sendSms({
      to: mobile,
      message: `Your Jay Tech verification OTP is ${otp}. It expires in 5 minutes. Do not share this code.`,
    });
  } catch (error) {
    await MobileOtp.deleteOne({ mobile });
    throw error;
  }

  return { success: true, message: "Mobile OTP sent successfully" };
};

const verifyMobileOtp = async (mobile, otp) => {
  if (!mobile || !/^\d{6}$/.test(String(otp))) {
    return { success: false, message: "Invalid OTP" };
  }

  const record = await MobileOtp.findOne({ mobile });

  if (!record || record.expiresAt <= new Date()) {
    return {
      success: false,
      message: "OTP expired. Please request a new OTP.",
    };
  }

  if (record.attempts >= 5) {
    await MobileOtp.deleteOne({ _id: record._id });
    return {
      success: false,
      message: "Too many attempts. Please request a new OTP.",
    };
  }

  if (record.otpHash !== hashOtp(String(otp))) {
    record.attempts += 1;
    await record.save();

    return { success: false, message: "Incorrect OTP" };
  }

  await MobileOtp.deleteOne({ _id: record._id });

  return { success: true, message: "Mobile OTP verified successfully" };
};

module.exports = { sendMobileOtp, verifyMobileOtp };
