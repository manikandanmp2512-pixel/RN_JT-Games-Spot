const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");

const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const sendSms = require("../utils/sendSms");

// ============================================================
// HELPERS
// ============================================================

const hashOtp = (otp) =>
  crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");

const generateOtp = () =>
  String(
    Math.floor(
      100000 + Math.random() * 900000
    )
  );

const publicUser = (u) => ({
  id: u._id,
  _id: u._id,
  fname: u.fname,
  lname: u.lname,
  email: u.email,
  mobilenumber: u.mobilenumber,
  countryCode: u.countryCode,
  role: u.role,
  rating: u.rating,
  gems: u.gems,
  randomAvatar: u.randomAvatar,
  profilePhoto: u.profilePhoto,
});

// ============================================================
// REGISTER
// ============================================================

exports.register = async (req, res) => {
  try {
    const {
      fname,
      lname,
      email,
      mobilenumber,
      countryCode = "+91",
      password,
      confirmPassword,
    } = req.body;

    // ----------------------------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------------------------

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
        message: "All fields are required",
      });
    }

    // ----------------------------------------------------------
    // NORMALIZE
    // ----------------------------------------------------------

    const normalizedFname =
      String(fname).trim();

    const normalizedLname =
      String(lname).trim();

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const normalizedMobile =
      String(mobilenumber).trim();

    const normalizedCountryCode =
      String(countryCode).trim();

    // ----------------------------------------------------------
    // NAME VALIDATION
    // ----------------------------------------------------------

    if (!/^[A-Za-z]{2,30}$/.test(normalizedFname)) {
      return res.status(400).json({
        success: false,
        message:
          "First name must contain only letters and be 2-30 characters",
      });
    }

    if (!/^[A-Z]{1,2}$/.test(normalizedLname)) {
      return res.status(400).json({
        success: false,
        message:
          "Last name must contain only letters and be 2-30 characters",
      });
    }

    // ----------------------------------------------------------
    // EMAIL
    // ----------------------------------------------------------

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // ----------------------------------------------------------
    // COUNTRY CODE
    // ----------------------------------------------------------

    if (!/^\+[1-9]\d{0,2}$/.test(normalizedCountryCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid country code",
      });
    }

    // ----------------------------------------------------------
    // MOBILE
    // ----------------------------------------------------------

    if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number must contain a valid 10-digit Indian number",
      });
    }

    // ----------------------------------------------------------
    // PASSWORD
    // ----------------------------------------------------------

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters, uppercase, lowercase and number",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // ----------------------------------------------------------
    // CHECK EXISTING USER
    // ----------------------------------------------------------

    const existingUser = await User.findOne({
      $or: [
        {
          email: normalizedEmail,
        },
        {
          mobilenumber: normalizedMobile,
        },
      ],
    });

    if (existingUser) {
      if (
        existingUser.email ===
        normalizedEmail
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This email is already registered",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "This mobile number is already registered",
      });
    }

    // ----------------------------------------------------------
    // REMOVE OLD PENDING REGISTRATION
    // ----------------------------------------------------------

    await PendingRegistration.deleteOne({
      email: normalizedEmail,
    });

    // ----------------------------------------------------------
    // GENERATE TWO OTPs
    // ----------------------------------------------------------

    const emailOtp = generateOtp();
    const mobileOtp = generateOtp();

    // ----------------------------------------------------------
    // HASH PASSWORD
    // ----------------------------------------------------------

    const passwordHash =
      await bcrypt.hash(password, 10);

    // ----------------------------------------------------------
    // CREATE TEMPORARY REGISTRATION
    // ----------------------------------------------------------

    await PendingRegistration.create({
      fname: normalizedFname,
      lname: normalizedLname,
      email: normalizedEmail,
      mobilenumber: normalizedMobile,
      countryCode: normalizedCountryCode,

      passwordHash,

      emailOtpHash: hashOtp(emailOtp),
      mobileOtpHash: hashOtp(mobileOtp),

      emailOtpExpiry: new Date(
        Date.now() + 10 * 60 * 1000
      ),

      mobileOtpExpiry: new Date(
        Date.now() + 10 * 60 * 1000
      ),

      emailVerified: false,
      mobileVerified: false,
    });

    // ----------------------------------------------------------
    // SEND EMAIL OTP
    // ----------------------------------------------------------

    try {
      await sendEmail({
        to: normalizedEmail,

        subject: "JayTech Email Verification OTP",

        text: `Your JayTech registration OTP is ${emailOtp}.\n\n` + `This OTP will expire in 10 minutes.\n\n` + `Do not share this OTP with anyone.`,
      });
    } catch (emailError) {
      console.error(
        "EMAIL OTP ERROR:",
        emailError
      );

      await PendingRegistration.deleteOne({
        email: normalizedEmail,
      });

      return res.status(500).json({
        success: false,
        message:
          "Unable to send email OTP. Please check the email service configuration.",
      });
    }

    // ----------------------------------------------------------
    // SEND MOBILE OTP
    // ----------------------------------------------------------

    try {
      await sendSms({
        to:
          `${normalizedCountryCode}${normalizedMobile}`,

        message:
          `Your JayTech registration OTP is ${mobileOtp}. It expires in 10 minutes.`,
      });
    } catch (smsError) {
      console.error(
        "MOBILE OTP ERROR:",
        smsError
      );

      await PendingRegistration.deleteOne({
        email: normalizedEmail,
      });

      return res.status(500).json({
        success: false,
        message:
          "Unable to send mobile OTP. Please check the SMS service configuration.",
      });
    }

    // ----------------------------------------------------------
    // SUCCESS
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "OTP sent to your email and mobile number.",

      email: normalizedEmail,

      mobile:
        `${normalizedCountryCode}${normalizedMobile}`,

      emailOtpSent: true,

      mobileOtpSent: true,
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Registration failed",
    });
  }
};

// ============================================================
// VERIFY REGISTER OTP
// ============================================================

exports.verifyRegisterOtp = async (
  req,
  res
) => {
  try {
    const {
      email,
      emailOtp,
      mobileOtp,
    } = req.body;

    // ----------------------------------------------------------
    // VALIDATE
    // ----------------------------------------------------------

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!emailOtp || !mobileOtp) {
      return res.status(400).json({
        success: false,
        message:
          "Both email OTP and mobile OTP are required",
      });
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    // ----------------------------------------------------------
    // FIND PENDING REGISTRATION
    // ----------------------------------------------------------

    const pending =
      await PendingRegistration.findOne({
        email: normalizedEmail,
      });

    if (!pending) {
      return res.status(404).json({
        success: false,
        message:
          "Registration session expired. Please register again.",
      });
    }

    // ----------------------------------------------------------
    // EMAIL OTP EXPIRY
    // ----------------------------------------------------------

    if (
      !pending.emailOtpExpiry ||
      pending.emailOtpExpiry < new Date()
    ) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Email OTP expired. Please register again.",
      });
    }

    // ----------------------------------------------------------
    // MOBILE OTP EXPIRY
    // ----------------------------------------------------------

    if (
      !pending.mobileOtpExpiry ||
      pending.mobileOtpExpiry < new Date()
    ) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Mobile OTP expired. Please register again.",
      });
    }

    // ----------------------------------------------------------
    // VERIFY EMAIL OTP
    // ----------------------------------------------------------

    const emailHash =
      hashOtp(emailOtp);

    if (
      emailHash !==
      pending.emailOtpHash
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email OTP",
      });
    }

    // ----------------------------------------------------------
    // VERIFY MOBILE OTP
    // ----------------------------------------------------------

    const mobileHash =
      hashOtp(mobileOtp);

    if (
      mobileHash !==
      pending.mobileOtpHash
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid mobile OTP",
      });
    }

    // ----------------------------------------------------------
    // BOTH OTPs VERIFIED
    // ----------------------------------------------------------

    // Check again before creating the real account.
    const existingUser =
      await User.findOne({
        $or: [
          {
            email: normalizedEmail,
          },
          {
            mobilenumber:
              pending.mobilenumber,
          },
        ],
      });

    if (existingUser) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(409).json({
        success: false,
        message:
          "Email or mobile number is already registered",
      });
    }

    // ----------------------------------------------------------
    // CREATE REAL USER ONLY NOW
    // ----------------------------------------------------------

    const user =
      await User.create({
        fname: pending.fname,
        lname: pending.lname,
        email: pending.email,
        mobilenumber:
          pending.mobilenumber,
        countryCode:
          pending.countryCode,

        password:
          pending.passwordHash,

        role: "user",

        rating: 1200,

        gems: 0,

        registerOtpVerified: true,
      });

    // ----------------------------------------------------------
    // DELETE TEMPORARY REGISTRATION
    // ----------------------------------------------------------

    await PendingRegistration.deleteOne({
      _id: pending._id,
    });

    // ----------------------------------------------------------
    // JWT
    // ----------------------------------------------------------

    const token =
      generateToken(user);

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Registration completed successfully",

      token,

      user: publicUser(user),
    });
  } catch (error) {
    console.error(
      "VERIFY REGISTER OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "OTP verification failed",
    });
  }
};

// ============================================================
// LOGIN
// ============================================================

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (
      !user ||
      !(await bcrypt.compare(
        password,
        user.password
      ))
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ============================================================
// FORGOT PASSWORD - SEND OTP
// ============================================================

exports.sendForgotOtp = async (
  req,
  res
) => {
  try {
    const email =
      String(req.body.email)
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const otp =
      generateOtp();

    user.forgotOtpHash =
      hashOtp(otp);

    user.forgotOtpExpiry =
      new Date(
        Date.now() +
        10 * 60 * 1000
      );

    user.forgotOtpVerified =
      false;

    await user.save();

    await sendEmail({
      to: email,

      subject:
        "JayTech Password Reset OTP",

      text:
        `Your JayTech password reset OTP is ${otp}.\n\n` +
        `It expires in 10 minutes.`,
    });

    return res.json({
      success: true,
      message: "OTP sent",
    });
  } catch (error) {
    console.error(
      "FORGOT OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send OTP",
    });
  }
};

// ============================================================
// VERIFY FORGOT OTP
// ============================================================

exports.verifyForgotOtp = async (
  req,
  res
) => {
  try {
    const email =
      String(req.body.email)
        .trim()
        .toLowerCase();

    const {
      otp,
    } = req.body;

    const user =
      await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    if (
      !user.forgotOtpExpiry ||
      user.forgotOtpExpiry < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (
      hashOtp(otp) !==
      user.forgotOtpHash
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.forgotOtpVerified =
      true;

    await user.save();

    return res.json({
      success: true,
      message: "OTP verified",
    });
  } catch (error) {
    console.error(
      "VERIFY FORGOT OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "OTP verification failed",
    });
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================

exports.resetPassword = async (
  req,
  res
) => {
  try {
    const email =
      String(req.body.email)
        .trim()
        .toLowerCase();

    const {
      password,
    } = req.body;

    const user =
      await User.findOne({ email });

    if (
      !user ||
      !user.forgotOtpVerified
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Verify OTP first",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (
      !passwordRegex.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters, uppercase, lowercase and number",
      });
    }

    user.password =
      await bcrypt.hash(
        password,
        10
      );

    user.forgotOtpHash =
      undefined;

    user.forgotOtpExpiry =
      undefined;

    user.forgotOtpVerified =
      false;

    await user.save();

    return res.json({
      success: true,
      message:
        "Password reset successful",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Password reset failed",
    });
  }
};