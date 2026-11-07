const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true, trim: true },
    lname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: { type: Boolean, default: false },
    mobilenumber: { type: String, required: true, unique: true, trim: true },
    countryCode: { type: String, default: "+91", trim: true },
    phoneE164: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    rating: { type: Number, default: 100 },
    gems: { type: Number, default: 0 },
    randomAvatar: { type: String, default: "🦊" },
    profilePhoto: { type: String, default: null },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    registerOtpHash: String,
    registerOtpExpiry: Date,
    registerOtpVerified: { type: Boolean, default: false },
    forgotOtpHash: String,
    forgotOtpExpiry: Date,
    forgotOtpVerified: { type: Boolean, default: false },
    forgotOtpAttempts: { type: Number, default: 0 },
    forgotOtpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
