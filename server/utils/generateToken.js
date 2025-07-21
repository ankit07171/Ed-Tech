import jwt from "jsonwebtoken";
 
const generateToken = (user, res) => {
  const token = jwt.sign(
    { userId: user._id },  
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );

  
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "Strict",
    maxAge: 15 * 24 * 60 * 60 * 1000,  
  });
 
  res.cookie("userRole", user.role, {
    httpOnly: false,  
    secure: process.env.NODE_ENV !== "development",
    sameSite: "Strict",
    maxAge: 15 * 24 * 60 * 60 * 1000,
  }); 
};

export default generateToken;
