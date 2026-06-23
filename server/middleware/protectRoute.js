import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const protect = async (req, res, next) => {
  try {
    // Accept token from cookie OR Authorization header
    let token = req.cookies.jwt;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return res.status(401).json({ error: "Unauthorized - No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ error: "Unauthorized - Invalid token" });

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized - Token failed" });
  }
};

export default protect;
