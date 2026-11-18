const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const { parsePhoneNumberFromString } = require("libphonenumber-js/max");
const generateToken = require("../utils/generateToken");
const { generateOtp, hashOtp, sendMobileOtp, normalizeE164 } = require("../utils/mobileOtpService");

const normalizeEmail = (value) => {
  const email = String(value || "").trim().toLowerCase();
  const gmailRegex = /^[a-z0-9](?:[a-z0-9.]{0,62}[a-z0-9])?@gmail\.com$/;
  if (!gmailRegex.test(email) || email.split("@")[0].includes("..")) return null;
  return email;
};

const normalizePhone = (countryCode, mobilenumber) => {
  const callingCode = String(countryCode || "").trim();
  const nationalNumber = String(mobilenumber || "").trim();
  if (!/^\+[1-9]\d{0,3}$/.test(callingCode) || !/^\d{4,14}$/.test(nationalNumber)) return null;
  const phone = parsePhoneNumberFromString(`${callingCode}${nationalNumber}`);
  if (!phone || !phone.isValid() || phone.getType() === "FIXED_LINE") return null;
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

const passwordIsValid = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(String(password || ""));

// REGISTER: send verification code to mobile, never to Gmail.
exports.register = async (req, res) => {
  let pendingId;
  try {
    const { fname, lname, email, mobilenumber, countryCode = "+91", password, confirmPassword } = req.body || {};
    if (!fname || !lname || !email || !mobilenumber || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const normalizedFname = String(fname).trim();
    const normalizedLname = String(lname).trim();
    const normalizedEmail = normalizeEmail(email);
    const phone = normalizePhone(countryCode, mobilenumber);

    if (!/^[A-Za-z]{2,30}$/.test(normalizedFname)) {
      return res.status(400).json({ success: false, message: "First name must contain 2–30 letters." });
    }
    if (!/^[A-Za-z]{1,30}$/.test(normalizedLname)) {
      return res.status(400).json({ success: false, message: "Last name must contain 1–30 letters." });
    }
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Enter a valid Gmail address ending in @gmail.com." });
    }
    if (!phone) {
      return res.status(400).json({ success: false, message: "Please enter a valid international mobile number." });
    }
    if (!passwordIsValid(password)) {
      return res.status(400).json({ success: false, message: "Password must contain at least 6 characters, uppercase, lowercase and a number." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { phoneE164: phone.phoneE164 }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.email === normalizedEmail ? "This Gmail address is already registered." : "This mobile number is already registered.",
      });
    }

    await PendingRegistration.deleteMany({ $or: [{ email: normalizedEmail }, { phoneE164: phone.phoneE164 }] });

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
      smsOtpHash: hashOtp(otp),
      smsOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      smsOtpAttempts: 0,
    });
    pendingId = pending._id;

    try {
      await sendMobileOtp({ mobile: phone.phoneE164, otp, purpose: "registration" });
    } catch (smsError) {
      console.error("REGISTRATION SMS ERROR:", smsError.message, smsError.code);
      await PendingRegistration.deleteOne({ _id: pending._id });
      pendingId = null;
      return res.status(502).json({ success: false, message: "Unable to send registration SMS OTP. Check Twilio configuration and phone number." });
    }

    return res.status(201).json({
      success: true,
      message: "Mobile OTP sent successfully.",
      phoneOtpSent: true,
      mobile: phone.phoneE164,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error.message, error.code);
    if (pendingId) await PendingRegistration.deleteOne({ _id: pendingId }).catch(() => {});
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This Gmail address or mobile number is already in use." });
    }
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

// VERIFY REGISTRATION SMS OTP
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const mobile = normalizeE164(req.body?.mobile);
    const otp = String(req.body?.otp || "").trim();
    if (!mobile || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Enter a valid mobile number and 6-digit SMS OTP." });
    }

    const pending = await PendingRegistration.findOne({ phoneE164: mobile });
    if (!pending) return res.status(404).json({ success: false, message: "Registration session expired. Please register again." });

    if (!pending.smsOtpExpiry || pending.smsOtpExpiry < new Date()) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(400).json({ success: false, message: "SMS OTP expired. Please register again." });
    }
    if ((pending.smsOtpAttempts || 0) >= 5) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(429).json({ success: false, message: "Too many incorrect OTP attempts. Please register again." });
    }
    if (hashOtp(otp) !== pending.smsOtpHash) {
      pending.smsOtpAttempts = (pending.smsOtpAttempts || 0) + 1;
      await pending.save();
      return res.status(400).json({
        success: false,
        message: "Incorrect mobile OTP. Please try again.",
        attemptsRemaining: Math.max(0, 5 - pending.smsOtpAttempts),
      });
    }

    const duplicate = await User.findOne({ $or: [{ email: pending.email }, { phoneE164: pending.phoneE164 }] });
    if (duplicate) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(409).json({ success: false, message: duplicate.email === pending.email ? "This Gmail address is already registered." : "This mobile number is already registered." });
    }

    const user = await User.create({
      fname: pending.fname,
      lname: pending.lname,
      email: pending.email,
      emailVerified: false,
      mobilenumber: pending.mobilenumber,
      countryCode: pending.countryCode,
      phoneE164: pending.phoneE164,
      password: pending.passwordHash,
      role: "user",
      registerOtpVerified: true,
    });
    await PendingRegistration.deleteOne({ _id: pending._id });
    return res.status(201).json({ success: true, message: "Registration completed successfully.", token: generateToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("VERIFY REGISTER SMS ERROR:", error.message, error.code);
    if (error.code === 11000) return res.status(409).json({ success: false, message: "This Gmail address or mobile number is already registered." });
    return res.status(500).json({ success: false, message: "Mobile OTP verification failed. Please try again." });
  }
};

// Keep login unchanged: mobile national number + password.
exports.login = async (req, res) => {
  try {
    const mobilenumber = String(req.body?.mobilenumber || "").replace(/\D/g, "");
    const password = req.body?.password;
    if (!mobilenumber || !password) return res.status(400).json({ success: false, message: "Mobile number and password are required." });
    if (mobilenumber.length < 6 || mobilenumber.length > 15) return res.status(400).json({ success: false, message: "Please enter a valid mobile number." });
    const matches = await User.find({ mobilenumber }).limit(2);
    if (matches.length > 1) return res.status(409).json({ success: false, message: "This mobile number is linked to more than one account. Please contact support." });
    const user = matches[0];
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: "Invalid mobile number or password." });
    return res.json({ success: true, message: "Login successful.", token: generateToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
};

// FORGOT PASSWORD: sends SMS to the account's registered mobile.
exports.sendForgotOtp = async (req, res) => {
  try {
    const mobile = normalizeE164(req.body?.mobile);
    if (!mobile) return res.status(400).json({ success: false, message: "Enter a valid international mobile number." });

    const user = await User.findOne({ phoneE164: mobile });
    // Avoid revealing account existence.
    if (!user) return res.json({ success: true, message: "If this mobile number is registered, a password reset OTP will be sent." });

    const otp = generateOtp();
    user.forgotOtpHash = hashOtp(otp);
    user.forgotOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.forgotOtpVerified = false;
    user.forgotOtpAttempts = 0;
    await user.save({ validateModifiedOnly: true });

    try {
      await sendMobileOtp({ mobile, otp, purpose: "forgot-password" });
    } catch (smsError) {
      console.error("FORGOT PASSWORD SMS ERROR:", smsError.message, smsError.code);
      user.forgotOtpHash = undefined;
      user.forgotOtpExpiry = undefined;
      user.forgotOtpVerified = false;
      user.forgotOtpAttempts = 0;
      await user.save({ validateModifiedOnly: true });
      return res.status(502).json({ success: false, message: "Unable to send password reset SMS OTP. Please try again later." });
    }
    return res.json({ success: true, message: "Password reset OTP sent to your registered mobile." });
  } catch (error) {
    console.error("FORGOT OTP ERROR:", error.message, error.code);
    return res.status(500).json({ success: false, message: "Unable to send password reset OTP." });
  }
};

exports.verifyForgotOtp = async (req, res) => {
  try {
    const mobile = normalizeE164(req.body?.mobile);
    const otp = String(req.body?.otp || "").trim();
    if (!mobile || !/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: "Enter a valid mobile number and 6-digit OTP." });

    const user = await User.findOne({ phoneE164: mobile });
    if (!user) return res.status(400).json({ success: false, message: "Invalid mobile number or OTP." });
    if (!user.forgotOtpExpiry || user.forgotOtpExpiry < new Date()) return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
    if (user.forgotOtpVerified) return res.json({ success: true, message: "OTP has already been verified." });
    if ((user.forgotOtpAttempts || 0) >= 5) {
      user.forgotOtpHash = undefined;
      user.forgotOtpExpiry = undefined;
      user.forgotOtpVerified = false;
      user.forgotOtpAttempts = 0;
      await user.save({ validateModifiedOnly: true });
      return res.status(429).json({ success: false, message: "Too many incorrect OTP attempts. Request a new OTP." });
    }
    if (hashOtp(otp) !== user.forgotOtpHash) {
      user.forgotOtpAttempts = (user.forgotOtpAttempts || 0) + 1;
      await user.save({ validateModifiedOnly: true });
      return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again.", attemptsRemaining: Math.max(0, 5 - user.forgotOtpAttempts) });
    }
    user.forgotOtpVerified = true;
    await user.save({ validateModifiedOnly: true });
    return res.json({ success: true, message: "Mobile OTP verified successfully." });
  } catch (error) {
    console.error("VERIFY FORGOT OTP ERROR:", error.message);
    return res.status(500).json({ success: false, message: "OTP verification failed." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const mobile = normalizeE164(req.body?.mobile);
    const password = req.body?.password;
    if (!mobile || !password) return res.status(400).json({ success: false, message: "Mobile number and new password are required." });

    const user = await User.findOne({ phoneE164: mobile });
    if (!user || !user.forgotOtpVerified || !user.forgotOtpExpiry || user.forgotOtpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "Verify a valid mobile OTP before resetting your password." });
    }
    if (!passwordIsValid(password)) return res.status(400).json({ success: false, message: "Password must contain at least 6 characters, uppercase, lowercase and a number." });

    user.password = await bcrypt.hash(password, 10);
    user.forgotOtpHash = undefined;
    user.forgotOtpExpiry = undefined;
    user.forgotOtpVerified = false;
    user.forgotOtpAttempts = 0;
    await user.save({ validateModifiedOnly: true });
    return res.json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Password reset failed." });
  }
};

// Compatibility export for older routes referring to verifySmsOtp.
exports.verifySmsOtp = exports.verifyRegisterOtp;
