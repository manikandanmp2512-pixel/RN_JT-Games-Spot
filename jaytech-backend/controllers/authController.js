
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const { parsePhoneNumberFromString } = require("libphonenumber-js/max");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const normalizeEmail = (value) => {
  const email = String(value || "").trim().toLowerCase();

  const gmailRegex =
    /^[a-z0-9](?:[a-z0-9.]{0,62}[a-z0-9])?@gmail\.com$/;

  if (!gmailRegex.test(email)) {
    return null;
  }

  if (email.split("@")[0].includes("..")) {
    return null;
  }

  return email;
};

const normalizePhone = (countryCode, mobilenumber) => {
  const callingCode = String(countryCode || "").trim();
  const nationalNumber = String(mobilenumber || "").trim();

  if (!/^\+[1-9]\d{0,3}$/.test(callingCode)) {
    return null;
  }

  if (!/^\d{4,14}$/.test(nationalNumber)) {
    return null;
  }

  const phone = parsePhoneNumberFromString(
    `${callingCode}${nationalNumber}`
  );

  if (!phone || !phone.isValid()) {
    return null;
  }

  if (phone.getType() === "FIXED_LINE") {
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
  email: user.email,
  emailVerified: user.emailVerified,
  mobilenumber: user.mobilenumber,
  countryCode: user.countryCode,
  role: user.role,
  rating: user.rating,
  gems: user.gems,
  randomAvatar: user.randomAvatar,
  profilePhoto: user.profilePhoto,
});

/* -------------------------------------------------------------------------- */
/* EMAIL HELPER                                                               */
/* -------------------------------------------------------------------------- */

const sendOtpEmail = async ({ email, name, otp, purpose }) => {
  const isRegistration = purpose === "registration";

  const subject = isRegistration
    ? "Jay Tech Registration Verification Code"
    : "Jay Tech Password Reset Verification Code";

  const purposeText = isRegistration
    ? "complete your Jay Tech registration"
    : "reset your Jay Tech account password";

  const text =
    `Hello ${name || "User"},\n\n` +
    `Your Jay Tech verification OTP is: ${otp}\n\n` +
    `Use this code to ${purposeText}.\n\n` +
    "This OTP expires in 10 minutes.\n" +
    "Do not share this OTP with anyone.\n\n" +
    "If you did not request this code, please ignore this email.\n\n" +
    "Jay Tech Team";

  await sendEmail({
    to: email,
    subject,
    text,
  });
};

/* -------------------------------------------------------------------------- */
/* REGISTER — GMAIL OTP ONLY                                                  */
/* -------------------------------------------------------------------------- */

exports.register = async (req, res) => {
  let pendingId = null;

  try {
    const {
      fname,
      lname,
      email,
      mobilenumber,
      countryCode = "+91",
      password,
      confirmPassword,
    } = req.body || {};

    if (
      !fname ||
      !lname ||
      !email ||
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
    const normalizedEmail = normalizeEmail(email);

    const phone = normalizePhone(countryCode, mobilenumber);

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

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Gmail address ending in @gmail.com.",
      });
    }

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
      $or: [
        { email: normalizedEmail },
        { phoneE164: phone.phoneE164 },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === normalizedEmail
            ? "This Gmail address is already registered."
            : "This mobile number is already registered.",
      });
    }

    await PendingRegistration.deleteMany({
      $or: [
        { email: normalizedEmail },
        { phoneE164: phone.phoneE164 },
      ],
    });

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);

    const pending = await PendingRegistration.create({
      fname: normalizedFname,
      lname: normalizedLname,
      email: normalizedEmail,
      mobilenumber: phone.mobilenumber,
      countryCode: phone.countryCode,
      phoneE164: phone.phoneE164,
      passwordHash,
      emailOtpHash: hashOtp(otp),
      emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      emailOtpAttempts: 0,
    });

    pendingId = pending._id;

    try {
      await sendOtpEmail({
        email: normalizedEmail,
        name: normalizedFname,
        otp,
        purpose: "registration",
      });
    } catch (emailError) {
      console.error("REGISTRATION EMAIL ERROR:", {
        code: emailError.code,
        responseCode: emailError.responseCode,
        message: emailError.message,
      });

      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      pendingId = null;

      return res.status(502).json({
        success: false,
        message:
          "Unable to send Gmail OTP. Check EMAIL_USER and EMAIL_PASS in the backend environment.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Gmail OTP sent successfully.",
      emailOtpSent: true,
      email: normalizedEmail,
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

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This Gmail address or mobile number is already being used.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

/* -------------------------------------------------------------------------- */
/* VERIFY REGISTRATION — GMAIL OTP ONLY                                       */
/* -------------------------------------------------------------------------- */

// Gmail OTP verification for registration.

exports.verifyRegisterOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.emailOtp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Gmail address and 6-digit email OTP.",
      });
    }

    const pending = await PendingRegistration.findOne({
      email,
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Registration session expired. Please register again.",
      });
    }

    if (
      !pending.emailOtpExpiry ||
      pending.emailOtpExpiry < new Date()
    ) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(400).json({
        success: false,
        message: "Gmail OTP expired. Please register again.",
      });
    }

    if ((pending.emailOtpAttempts || 0) >= 5) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect OTP attempts. Please register again.",
      });
    }

    if (hashOtp(otp) !== pending.emailOtpHash) {
      pending.emailOtpAttempts =
        (pending.emailOtpAttempts || 0) + 1;

      await pending.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect Gmail OTP. Please try again.",
        attemptsRemaining: Math.max(
          0,
          5 - pending.emailOtpAttempts
        ),
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: pending.email },
        { phoneE164: pending.phoneE164 },
      ],
    });

    if (existingUser) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(409).json({
        success: false,
        message:
          existingUser.email === pending.email
            ? "This Gmail address is already registered."
            : "This mobile number is already registered.",
      });
    }

    const user = await User.create({
      fname: pending.fname,
      lname: pending.lname,
      email: pending.email,
      emailVerified: true,
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
    console.error("VERIFY GMAIL OTP ERROR:", {
      message: error.message,
      code: error.code,
    });

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This Gmail address or mobile number is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Gmail OTP verification failed. Please try again.",
    });
  }
};

exports.verifySmsOtp = exports.verifyRegisterOtp;

/* -------------------------------------------------------------------------- */
/* LOGIN — MOBILE NUMBER + PASSWORD                                           */
/* -------------------------------------------------------------------------- */

exports.login = async (req, res) => {
  try {
    const mobilenumber = String(req.body?.mobilenumber || "").replace(/\D/g, "");
    const password = req.body?.password;

    if (!mobilenumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required.",
      });
    }

    if (mobilenumber.length < 6 || mobilenumber.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid mobile number.",
      });
    }

    // Login intentionally uses the national mobile number only (no country code).
    // User.mobilenumber must be unique for this login method to be unambiguous.
    const matches = await User.find({ mobilenumber }).limit(2);

    if (matches.length > 1) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is linked to more than one account. Please contact support.",
      });
    }

    const user = matches[0];

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
/* FORGOT PASSWORD — SEND GMAIL OTP                                           */
/* -------------------------------------------------------------------------- */

exports.sendForgotOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Gmail address.",
      });
    }

    const user = await User.findOne({
      email,
    });

    // Do not reveal whether an account exists.
    if (!user) {
      return res.json({
        success: true,
        message:
          "If this Gmail address is registered, a password reset OTP will be sent.",
      });
    }

    const otp = generateOtp();

    user.forgotOtpHash = hashOtp(otp);
    user.forgotOtpExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    );
    user.forgotOtpVerified = false;
    user.forgotOtpAttempts = 0;

    await user.save();

    try {
      await sendOtpEmail({
        email,
        name: user.fname,
        otp,
        purpose: "forgot-password",
      });
    } catch (emailError) {
      console.error("FORGOT PASSWORD EMAIL ERROR:", {
        code: emailError.code,
        responseCode: emailError.responseCode,
        message: emailError.message,
      });

      user.forgotOtpHash = undefined;
      user.forgotOtpExpiry = undefined;
      user.forgotOtpVerified = false;
      user.forgotOtpAttempts = 0;

      await user.save();

      return res.status(502).json({
        success: false,
        message: "Unable to send password reset Gmail OTP.",
      });
    }

    return res.json({
      success: true,
      message: "Password reset OTP sent to your Gmail address.",
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
/* VERIFY FORGOT PASSWORD — GMAIL OTP                                         */
/* -------------------------------------------------------------------------- */

exports.verifyForgotOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.emailOtp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Gmail address and 6-digit OTP.",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Gmail address or OTP.",
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

    if (user.forgotOtpVerified) {
      return res.json({
        success: true,
        message: "OTP has already been verified.",
      });
    }

    if ((user.forgotOtpAttempts || 0) >= 5) {
      user.forgotOtpHash = undefined;
      user.forgotOtpExpiry = undefined;
      user.forgotOtpVerified = false;
      user.forgotOtpAttempts = 0;

      await user.save();

      return res.status(429).json({
        success: false,
        message: "Too many incorrect OTP attempts. Request a new OTP.",
      });
    }

    if (hashOtp(otp) !== user.forgotOtpHash) {
      user.forgotOtpAttempts =
        (user.forgotOtpAttempts || 0) + 1;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please try again.",
        attemptsRemaining: Math.max(
          0,
          5 - user.forgotOtpAttempts
        ),
      });
    }

    user.forgotOtpVerified = true;
    await user.save();

    return res.json({
      success: true,
      message: "Gmail OTP verified successfully.",
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
/* RESET PASSWORD — AFTER GMAIL OTP VERIFICATION                              */
/* -------------------------------------------------------------------------- */

exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Gmail address and new password are required.",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (
      !user ||
      !user.forgotOtpVerified ||
      !user.forgotOtpExpiry ||
      user.forgotOtpExpiry < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Verify a valid Gmail OTP before resetting your password.",
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
    user.forgotOtpAttempts = 0;

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
