// const jwt = require("jsonwebtoken");
// module.exports = function generateToken(user) {
//   return jwt.sign({ id: user._id.toString(), email: user.email, role: user.role || "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  if (!user || !user._id) {
    throw new Error("Cannot generate token: user ID is missing");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

module.exports = generateToken;