const mongoose = require("mongoose");

const PendingRegistrationSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true, trim: true },
    lname: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobilenumber: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, trim: true },
    phoneE164: { type: String, required: true, trim: true },
    emailOtpHash: { type: String, required: true },
    emailOtpExpiry: { type: Date, required: true },
    emailOtpAttempts: { type: Number, default: 0 },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

PendingRegistrationSchema.index({ email: 1 }, { unique: true });
PendingRegistrationSchema.index({ phoneE164: 1 }, { unique: true });
// PendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model("PendingRegistration", PendingRegistrationSchema);
