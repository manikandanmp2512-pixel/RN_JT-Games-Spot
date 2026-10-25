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

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobilenumber: {
      type: String,
      required: true,
      trim: true,
    },

    countryCode: {
      type: String,
      default: "+91",
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    emailOtpHash: {
      type: String,
      required: true,
    },

    mobileOtpHash: {
      type: String,
      required: true,
    },

    emailOtpExpiry: {
      type: Date,
      required: true,
    },

    mobileOtpExpiry: {
      type: Date,
      required: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    mobileVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically remove abandoned registrations after 15 minutes.
PendingRegistrationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 900 }
);

// One pending registration per email.
PendingRegistrationSchema.index(
  { email: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "PendingRegistration",
  PendingRegistrationSchema
);