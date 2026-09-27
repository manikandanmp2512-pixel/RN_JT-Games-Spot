const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const publicUser = (u) => ({ id: u._id, _id: u._id, fname: u.fname, lname: u.lname, email: u.email, mobilenumber: u.mobilenumber, countryCode: u.countryCode, role: u.role, rating: u.rating, gems: u.gems, randomAvatar: u.randomAvatar, profilePhoto: u.profilePhoto });

exports.register = async (req, res) => {
  try {
    const { fname, lname, email, mobilenumber, countryCode = "+91", password, confirmPassword } = req.body;
    if (!fname || !lname || !email || !mobilenumber || !password || !confirmPassword) return res.status(400).json({ success: false, message: "All fields are required" });
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: "Passwords do not match" });
    if (!/^\d{10}$/.test(String(mobilenumber))) return res.status(400).json({ success: false, message: "Mobile number must contain 10 digits" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "Email already registered" });
    const otp = generateOtp();
    const user = await User.create({ fname: fname.trim(), lname: lname.trim(), email: normalizedEmail, mobilenumber: String(mobilenumber), countryCode, password: await bcrypt.hash(password, 10), registerOtpHash: hashOtp(otp), registerOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), registerOtpVerified: false });
    try { await sendEmail({ to: normalizedEmail, subject: "JayTech registration OTP", text: `Your registration OTP is ${otp}. It expires in 10 minutes.` }); } catch (e) { console.log("OTP email warning:", e.message); }
    return res.status(201).json({ success: true, message: "Registration created. Verify OTP.", email: normalizedEmail, userId: user._id });
  } catch (e) { console.error(e); return res.status(500).json({ success: false, message: "Registration failed" }); }
};

exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.registerOtpVerified) return res.status(400).json({ success: false, message: "Already verified" });
    if (!user.registerOtpExpiry || user.registerOtpExpiry < new Date()) return res.status(400).json({ success: false, message: "OTP expired" });
    if (hashOtp(otp) !== user.registerOtpHash) return res.status(400).json({ success: false, message: "Invalid OTP" });
    user.registerOtpVerified = true; user.registerOtpHash = undefined; user.registerOtpExpiry = undefined; await user.save();
    return res.json({ success: true, message: "Registration verified", token: generateToken(user), user: publicUser(user) });
  } catch (e) { return res.status(500).json({ success: false, message: "OTP verification failed" }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: "Invalid email or password" });
    return res.json({ success: true, message: "Login successful", token: generateToken(user), user: publicUser(user) });
  } catch (e) { return res.status(500).json({ success: false, message: "Login failed" }); }
};

exports.sendForgotOtp = async (req, res) => {
  try { const email = String(req.body.email).trim().toLowerCase(); const user = await User.findOne({ email }); if (!user) return res.status(404).json({ success: false, message: "Email not found" }); const otp = generateOtp(); user.forgotOtpHash = hashOtp(otp); user.forgotOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); user.forgotOtpVerified = false; await user.save(); await sendEmail({ to: email, subject: "JayTech password reset OTP", text: `Your OTP is ${otp}. It expires in 10 minutes.` }); return res.json({ success: true, message: "OTP sent" }); } catch (e) { return res.status(500).json({ success: false, message: "Unable to send OTP" }); }
};
exports.verifyForgotOtp = async (req, res) => {
  try { const email = String(req.body.email).trim().toLowerCase(); const user = await User.findOne({ email }); if (!user) return res.status(404).json({ success: false, message: "Email not found" }); if (!user.forgotOtpExpiry || user.forgotOtpExpiry < new Date()) return res.status(400).json({ success: false, message: "OTP expired" }); if (hashOtp(req.body.otp) !== user.forgotOtpHash) return res.status(400).json({ success: false, message: "Invalid OTP" }); user.forgotOtpVerified = true; await user.save(); return res.json({ success: true, message: "OTP verified" }); } catch (e) { return res.status(500).json({ success: false, message: "OTP verification failed" }); }
};
exports.resetPassword = async (req, res) => {
  try { const email = String(req.body.email).trim().toLowerCase(); const user = await User.findOne({ email }); if (!user || !user.forgotOtpVerified) return res.status(400).json({ success: false, message: "Verify OTP first" }); if (!req.body.password || req.body.password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" }); user.password = await bcrypt.hash(req.body.password, 10); user.forgotOtpHash = undefined; user.forgotOtpExpiry = undefined; user.forgotOtpVerified = false; await user.save(); return res.json({ success: true, message: "Password reset successful" }); } catch (e) { return res.status(500).json({ success: false, message: "Password reset failed" }); }
};
