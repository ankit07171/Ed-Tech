import jwt from "jsonwebtoken";

const generateToken = (user) => {
  const token = jwt.sign(
    { userId: user._id, userName: user.fullName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );
  return token;
};

export default generateToken;
