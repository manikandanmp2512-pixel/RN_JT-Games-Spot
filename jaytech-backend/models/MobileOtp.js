const mongoose = require("mongoose");

const mobileOtpSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["registration", "forgot-password", "other"],
      required: true,
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// OTPs are separated by mobile and purpose.
mobileOtpSchema.index({ mobile: 1, purpose: 1 }, { unique: true });

module.exports = mongoose.model("MobileOtp", mobileOtpSchema);