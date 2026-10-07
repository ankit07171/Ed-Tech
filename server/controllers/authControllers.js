import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import Department from "../models/departmentModel.js";
import generateToken from "../utils/generateToken.js";
import sendOTPEmail from "../utils/sendMail.js";

const otpStore = new Map(); 

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = await sendOTPEmail(email);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    otpStore.set(email, { otp, expiresAt });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Signup Controller
export const signup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      gender,
      contact,
      role,
      department,
      userOtp,
      // Student-specific fields
      rollNumber,
      batch,
      semester,
      // Teacher-specific fields
      employeeId,
      designation,
      specialization,
    } = req.body;

    if (!otpStore.has(email)) {
      return res.status(400).json({ error: "Please request OTP first" });
    }

    const { otp, expiresAt } = otpStore.get(email);

    if (Date.now() > expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP expired" });
    }

    if (parseInt(userOtp) !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpStore.delete(email); // cleanup used OTP

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Verify department exists
    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(400).json({ error: "Invalid department" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashPass,
      gender,
      contact,
      role: role || "student",
      department,
      profilePic: null, // No default avatar
    });

    // Add role-specific fields
    if (role === "student") {
      if (rollNumber) newUser.rollNumber = rollNumber;
      if (batch) newUser.batch = batch;
      if (semester) newUser.semester = semester;
    } else if (role === "teacher") {
      if (employeeId) newUser.employeeId = employeeId;
      if (designation) newUser.designation = designation;
      if (specialization) newUser.specialization = specialization;
    }

    await newUser.save();
    const token = generateToken(newUser, res);

    res.status(201).json({
      msg: "Signup successful",
      token,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("department", "name code");
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user, res);

    res.status(200).json({
      msg: "Login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        profilePic: user.profilePic,
        rollNumber: user.rollNumber,
        batch: user.batch,
        semester: user.semester,
        employeeId: user.employeeId,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Logout Controller
export const logout = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    res.clearCookie("userRole", {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get All Teachers
export const getTeachers = async (req, res) => {
  try {
    const { department } = req.query;
    
    const filter = { role: "teacher", isActive: true };
    if (department) filter.department = department;

    const teachers = await User.find(filter)
      .select("fullName email profilePic role department designation specialization experience")
      .populate("department", "name code")
      .sort({ fullName: 1 });

    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error.message);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
};

// Get All Students
export const getStudents = async (req, res) => {
  try {
    const { department, batch, semester } = req.query;
    
    const filter = { role: "student", isActive: true };
    if (department) filter.department = department;
    if (batch) filter.batch = parseInt(batch);
    if (semester) filter.semester = parseInt(semester);

    const students = await User.find(filter)
      .select("fullName email profilePic role department rollNumber batch semester cgpa")
      .populate("department", "name code")
      .sort({ rollNumber: 1 });

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

// Get All Departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .select("name code description hodName totalStudents totalTeachers")
      .sort({ name: 1 });

    res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .select("-password")
      .populate("department", "name code description");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("department", "name code");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
