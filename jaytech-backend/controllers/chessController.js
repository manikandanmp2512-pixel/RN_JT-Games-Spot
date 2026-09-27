const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

const flag = (code = "+91") => ({ "+91": "🇮🇳", "+1": "🇺🇸", "+44": "🇬🇧", "+61": "🇦🇺", "+81": "🇯🇵", "+82": "🇰🇷", "+971": "🇦🇪", "+65": "🇸🇬", "+60": "🇲🇾", "+94": "🇱🇰" }[code] || "🌍");
const publicUser = (u) => ({ id: u._id, name: `${u.fname} ${u.lname}`.trim(), rating: u.rating, gems: u.gems, countryFlag: flag(u.countryCode), avatar: u.randomAvatar, profilePhoto: u.profilePhoto, online: false });

exports.presence = (req, res) => res.json({ success: true, count: req.app.locals.onlineCount || 0 });
exports.friends = async (req, res) => { const user = await User.findById(req.user.id).populate("friends", "fname lname rating countryCode randomAvatar profilePhoto"); res.json({ success: true, friends: (user?.friends || []).map((f) => publicUser(f)) }); };
exports.friendRequests = async (req, res) => { const requests = await FriendRequest.find({ to: req.user.id, status: "pending" }).populate("from", "fname lname rating countryCode randomAvatar profilePhoto"); res.json({ success: true, requests: requests.map((r) => ({ id: r._id, from: publicUser(r.from) })) }); };
exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Photo is required" });
  const dir = path.join(__dirname, "../uploads/profile"); fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(req.file.originalname || ".jpg") || ".jpg";
  const filename = `${req.user.id}-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(dir, filename), req.file.buffer);
  const url = `${req.protocol}://${req.get("host")}/uploads/profile/${filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, { profilePhoto: url }, { new: true });
  res.json({ success: true, profilePhoto: user.profilePhoto });
};
