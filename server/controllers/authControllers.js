import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
// import { sendOTPEmail } from "../utils/sendMail.js";

const maleAvatars = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Max",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Kai",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Noah",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Tom",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sam",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jay",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Eli",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Ben",
];

const femaleAvatars = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Emma",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Ava",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Maya",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Nora",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aria",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Ella",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Ivy",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Rose",
];

export const signup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      gender,
      contact,
      role} = req.body;
    const user = await User.findOne({ email });
    
    if (user) {return res.status(400).json({ error: "Email already registered" });} 

    const randomAvatar = gender === "male"
        ? maleAvatars[Math.floor(Math.random() * maleAvatars.length)]
        : femaleAvatars[Math.floor(Math.random() * femaleAvatars.length)];

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashPass,
      gender,
      contact,
      role,
      profilePic: randomAvatar,
    });

    await newUser.save();
    // generateToken(newUser._id, res);

    return res.status(201).json({
      msg: "User verified successfully",
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        role: newUser.role,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) { return res.status(400).json({ error: "User not found" });}

    const isMatch = await bcrypt.compare(password, user.password);  

    if (!isMatch) {return res.status(400).json({ error: "Invalid credentials" });} 

    generateToken(user, res);

    return res.status(200).json({
      msg: "User verified successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
 
export const getTeachers = async (req, res) => {
  try {
  // const query = role ? { role } : { role: "teacher" };
  const users = await User.find({role:"teacher"}).select("fullName email profilePic role");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
export const getStudents = async (req, res) => {
  try {   
    const users = await User.find({role:"student"}).select("fullName email profilePic role");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
