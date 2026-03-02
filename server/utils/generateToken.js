import jwt from "jsonwebtoken";

const generateToken = (user, res) => {
  const token = jwt.sign(
    { userId: user._id, userName: user.fullName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );

  // Cookie settings for cross-origin
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",  // true in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",  // None for cross-origin
    path: "/",
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  };

  console.log("🍪 Setting cookie with options:", cookieOptions);
  
  // Set httpOnly cookie for backend authentication
  res.cookie("jwt", token, cookieOptions);

  return token;
};

export default generateToken;
