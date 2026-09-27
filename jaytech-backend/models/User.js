const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
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
      unique: true,
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

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: [
        "user",
        "admin",
      ],
      default: "user",
    },

    rating: {
      type: Number,
      default: 1200,
    },

    gems: {
      type: Number,
      default: 0,
    },

    randomAvatar: {
      type: String,
      default: "🦊",
    },

    profilePhoto: {
      type: String,
      default: null,
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    registerOtpHash:
      String,

    registerOtpExpiry:
      Date,

    registerOtpVerified: {
      type: Boolean,
      default: false,
    },

    forgotOtpHash:
      String,

    forgotOtpExpiry:
      Date,

    forgotOtpVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "User",
    UserSchema
  );