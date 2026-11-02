
const mongoose = require("mongoose");

const PendingRegistrationSchema = new mongoose.Schema(
  {
    fname: {
      type: String,
      required: true,
      trim: true,
    },
    lname: {
      type: String,
      required: true,
      trim: true,
    },
    mobilenumber: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
    },
    phoneE164: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    otpProvider: {
      type: String,
      enum: ["development", "twilio"],
      required: true,
    },
    mobileOtpHash: {
      type: String,
      default: undefined,
    },
    mobileOtpExpiry: {
      type: Date,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Automatically remove expired pending registrations after 15 minutes.
PendingRegistrationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 900 }
);

module.exports = mongoose.model(
  "PendingRegistration",
  PendingRegistrationSchema
);
