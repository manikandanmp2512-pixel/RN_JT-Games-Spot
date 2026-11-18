const mongoose = require("mongoose");

const PendingRegistrationSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true, trim: true },
    lname: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobilenumber: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, trim: true },
    phoneE164: { type: String, required: true, trim: true },
    smsOtpHash: { type: String, required: true },
    smsOtpExpiry: { type: Date, required: true },
    smsOtpAttempts: { type: Number, default: 0 },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

PendingRegistrationSchema.index({ email: 1 }, { unique: true });
PendingRegistrationSchema.index({ phoneE164: 1 }, { unique: true });
// Keep expiry checked in controller rather than relying on a Mongo TTL index.
module.exports = mongoose.model("PendingRegistration", PendingRegistrationSchema);