const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");

const generateToken = require("../utils/generateToken");

const {
  sendSms,
  verifySmsOtp,
} = require("../utils/sendSms");

const {
  parsePhoneNumberFromString,
} = require("libphonenumber-js");

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const isDevelopmentOtpEnabled = () =>
  process.env.NODE_ENV === "development" &&
  process.env.ENABLE_DEV_REGISTRATION_OTP === "true";

const normalizePhone = (countryCode, mobilenumber) => {
  const fullNumber = `${String(countryCode || "").trim()}${String(
    mobilenumber || ""
  ).trim()}`;

  const phone = parsePhoneNumberFromString(fullNumber);

  if (!phone || !phone.isValid()) {
    return null;
  }

  return {
    countryCode: `+${phone.countryCallingCode}`,
    mobilenumber: phone.nationalNumber,
    phoneE164: phone.number,
  };
};

const publicUser = (user) => ({
  id: user._id,
  _id: user._id,
  fname: user.fname,
  lname: user.lname,
  mobilenumber: user.mobilenumber,
  countryCode: user.countryCode,
  role: user.role,
  rating: user.rating,
  gems: user.gems,
  randomAvatar: user.randomAvatar,
  profilePhoto: user.profilePhoto,
});

/* -------------------------------------------------------------------------- */
/* REGISTER — MOBILE NUMBER + SMS OTP                                         */
/* -------------------------------------------------------------------------- */

exports.register = async (req, res) => {

  // ADD THIS BLOCK HERE
  console.log("REGISTER REQUEST FIELD CHECK:", {
    hasBody: Boolean(req.body),
    hasFname: Boolean(req.body?.fname),
    hasLname: Boolean(req.body?.lname),
    hasCountryCode: Boolean(req.body?.countryCode),
    hasMobilenumber: Boolean(req.body?.mobilenumber),
    hasPassword: Boolean(req.body?.password),
    hasConfirmPassword: Boolean(req.body?.confirmPassword),
  });
  
  let pendingId = null;

  try {
    const {
      fname,
      lname,
      mobilenumber,
      countryCode = "+91",
      password,
      confirmPassword,
    } = req.body;

    if (
      !fname ||
      !lname ||
      !mobilenumber ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const normalizedFname = String(fname).trim();
    const normalizedLname = String(lname).trim();

    if (!/^[A-Za-z]{2,30}$/.test(normalizedFname)) {
      return res.status(400).json({
        success: false,
        message: "First name must contain 2–30 letters.",
      });
    }

    if (!/^[A-Za-z]{1,30}$/.test(normalizedLname)) {
      return res.status(400).json({
        success: false,
        message: "Last name must contain 1–30 letters.",
      });
    }

    const phone = normalizePhone(countryCode, mobilenumber);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid international mobile number.",
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters, uppercase, lowercase and a number.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const existingUser = await User.findOne({
      mobilenumber: phone.mobilenumber,
      countryCode: phone.countryCode,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered.",
      });
    }

    await PendingRegistration.deleteOne({
      mobilenumber: phone.mobilenumber,
      countryCode: phone.countryCode,
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const developmentOtp = generateOtp();

    const otpProvider = isDevelopmentOtpEnabled()
      ? "development"
      : "twilio";

    const pending = await PendingRegistration.create({
      fname: normalizedFname,
      lname: normalizedLname,
      mobilenumber: phone.mobilenumber,
      countryCode: phone.countryCode,
      phoneE164: phone.phoneE164,
      passwordHash,
      otpProvider,
      mobileOtpHash: hashOtp(developmentOtp),
      mobileOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    pendingId = pending._id;

    if (isDevelopmentOtpEnabled()) {
      return res.status(201).json({
        success: true,
        message: "Development OTP generated. SMS was not sent.",
        mobile: phone.phoneE164,
        mobileOtpSent: false,
        developmentOtp,
        developmentOnly: true,
      });
    }

    try {
      await sendSms({
        to: phone.phoneE164,
      });
    } catch (smsError) {
      console.error("REGISTRATION SMS ERROR:", {
        code: smsError.code,
        status: smsError.status,
        message: smsError.message,
      });

      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      pendingId = null;

      return res.status(502).json({
        success: false,
        message:
          "Unable to send mobile OTP. Please check your SMS provider configuration and destination-country permissions.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Mobile OTP sent successfully.",
      mobile: phone.phoneE164,
      mobileOtpSent: true,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", {
      message: error.message,
      code: error.code,
    });

    if (pendingId) {
      await PendingRegistration.deleteOne({
        _id: pendingId,
      }).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* VERIFY REGISTRATION SMS OTP                                                */
/* -------------------------------------------------------------------------- */

exports.verifySmsOtp = async (req, res) => {
  try {
    const {
      mobilenumber,
      countryCode = "+91",
      mobileOtp,
    } = req.body;

    if (!mobilenumber || !mobileOtp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required.",
      });
    }

    const phone = normalizePhone(countryCode, mobilenumber);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    const normalizedOtp = String(mobileOtp).trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const pending = await PendingRegistration.findOne({
      phoneE164: phone.phoneE164,
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Registration session expired. Please register again.",
      });
    }

    if (
      !pending.mobileOtpExpiry ||
      pending.mobileOtpExpiry < new Date()
    ) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(400).json({
        success: false,
        message: "Mobile OTP expired. Please register again.",
      });
    }

    let otpIsValid = false;

    if (pending.otpProvider === "development") {
      otpIsValid =
        hashOtp(normalizedOtp) === pending.mobileOtpHash;
    } else {
      try {
        otpIsValid = await verifySmsOtp({
          to: phone.phoneE164,
          code: normalizedOtp,
        });
      } catch (verifyError) {
        console.error("REGISTRATION OTP VERIFY ERROR:", {
          code: verifyError.code,
          status: verifyError.status,
          message: verifyError.message,
        });

        return res.status(502).json({
          success: false,
          message: "Unable to verify OTP with the SMS provider.",
        });
      }
    }

    if (!otpIsValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile OTP.",
      });
    }

    const existingUser = await User.findOne({
      mobilenumber: pending.mobilenumber,
      countryCode: pending.countryCode,
    });

    if (existingUser) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered.",
      });
    }

    const user = await User.create({
      fname: pending.fname,
      lname: pending.lname,
      mobilenumber: pending.mobilenumber,
      countryCode: pending.countryCode,
      phoneE164: pending.phoneE164,
      password: pending.passwordHash,
      role: "user",
      registerOtpVerified: true,
    });

    await PendingRegistration.deleteOne({
      _id: pending._id,
    });

    return res.status(201).json({
      success: true,
      message: "Registration completed successfully.",
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("VERIFY REGISTER OTP ERROR:", {
      message: error.message,
      code: error.code,
    });

    return res.status(500).json({
      success: false,
      message: "OTP verification failed. Please try again.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* LOGIN — MOBILE NUMBER + PASSWORD                                           */
/* -------------------------------------------------------------------------- */

exports.login = async (req, res) => {
  try {
    const {
      mobilenumber,
      countryCode = "+91",
      password,
    } = req.body;

    if (!mobilenumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required.",
      });
    }

    const phone = normalizePhone(countryCode, mobilenumber);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    const user = await User.findOne({
      phoneE164: phone.phoneE164,
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password.",
      });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* FORGOT PASSWORD — SEND SMS OTP                                             */
/* -------------------------------------------------------------------------- */

exports.sendForgotOtp = async (req, res) => {
  try {
    const {
      mobilenumber,
      countryCode = "+91",
    } = req.body;

    if (!mobilenumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required.",
      });
    }

    const phone = normalizePhone(countryCode, mobilenumber);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    const user = await User.findOne({
      phoneE164: phone.phoneE164,
    });

    // Use the same response whether or not the number is registered.
    if (!user) {
      return res.json({
        success: true,
        message:
          "If this mobile number is registered, a password reset OTP will be sent.",
      });
    }

    user.forgotOtpHash = undefined;
    user.forgotOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.forgotOtpVerified = false;

    await user.save();

    try {
      await sendSms({
        to: phone.phoneE164,
      });
    } catch (smsError) {
      user.forgotOtpExpiry = undefined;
      await user.save();

      console.error("FORGOT PASSWORD SMS ERROR:", {
        code: smsError.code,
        status: smsError.status,
        message: smsError.message,
      });

      return res.status(502).json({
        success: false,
        message: "Unable to send password reset OTP.",
      });
    }

    return res.json({
      success: true,
      message: "Password reset OTP sent to your mobile number.",
      mobile: phone.phoneE164,
    });
  } catch (error) {
    console.error("FORGOT OTP ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send password reset OTP.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* VERIFY FORGOT PASSWORD SMS OTP                                             */
/* -------------------------------------------------------------------------- */

exports.verifyForgotOtp = async (req, res) => {
  try {
    const {
      mobilenumber,
      countryCode = "+91",
      otp,
    } = req.body;

    if (!mobilenumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required.",
      });
    }

    const phone = normalizePhone(countryCode, mobilenumber);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    const normalizedOtp = String(otp).trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const user = await User.findOne({
      mobilenumber: phone.mobilenumber,
      countryCode: phone.countryCode,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number or OTP.",
      });
    }

    if (
      !user.forgotOtpExpiry ||
      user.forgotOtpExpiry < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    let otpIsValid = false;

    try {
      otpIsValid = await verifySmsOtp({
        to: phone.phoneE164,
        code: normalizedOtp,
      });
    } catch (verifyError) {
      console.error("FORGOT OTP VERIFY ERROR:", {
        code: verifyError.code,
        status: verifyError.status,
        message: verifyError.message,
      });

      return res.status(502).json({
        success: false,
        message: "Unable to verify OTP with the SMS provider.",
      });
    }

    if (!otpIsValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    user.forgotOtpVerified = true;
    await user.save();

    return res.json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY FORGOT OTP ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* RESET PASSWORD                                                             */
/* -------------------------------------------------------------------------- */

exports.resetPassword = async (req, res) => {
  try {
    const {
      mobilenumber,
      countryCode = "+91",
      password,
    } = req.body;

    if (!mobilenumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and new password are required.",
      });
    }

    const phone = normalizePhone(countryCode, mobilenumber);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number.",
      });
    }

    const user = await User.findOne({
      mobilenumber: phone.mobilenumber,
      countryCode: phone.countryCode,
    });

    if (
      !user ||
      !user.forgotOtpVerified ||
      !user.forgotOtpExpiry ||
      user.forgotOtpExpiry < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verify a valid OTP before resetting your password.",
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters, uppercase, lowercase and a number.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.forgotOtpHash = undefined;
    user.forgotOtpExpiry = undefined;
    user.forgotOtpVerified = false;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Password reset failed.",
    });
  }
};
