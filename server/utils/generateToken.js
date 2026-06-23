import jwt from "jsonwebtoken";

const generateToken = (user, res) => {
  const token = jwt.sign(
    { userId: user._id, userName: user.fullName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );

  // Cookie: secure only in production so localhost works too
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
    maxAge: 15 * 24 * 60 * 60 * 1000,
  };

  console.log("🍪 Setting cookie with options:", cookieOptions);
  
  // Set httpOnly cookie for backend authentication
  res.cookie("jwt", token, cookieOptions);

  return token;
};

export default generateToken;
