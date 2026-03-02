import jwt from "jsonwebtoken";

const generateToken = (user, res) => {
  const token = jwt.sign(
    { userId: user._id, userName: user.fullName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );

  res.cookie("jwt", token, {
  httpOnly: true,
  secure: false,        // must be true on Render
  sameSite: "lax",    // must be None for cross-domain
  path: "/",           // important
  maxAge: 15 * 24 * 60 * 60 * 1000,
});

  return token;
};

export default generateToken;
