import Notification from "../models/notifyModel.js";
import User from "../models/userModel.js";
 
// No need to read teacherId from body anymore
export const createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    // ✅ Get teacher from req.user injected by protect middleware
    const teacher = await User.findById(req.user._id);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can post notifications" });
    }

    const newNote = await Notification.create({
      title,
      message,
      createdBy: teacher._id,
    });

    res.status(201).json({ message: "Notification created", notification: newNote });
  } catch (err) {
    console.error("Notification create error:", err);
    res.status(500).json({ error: "Failed to create notification", err });
  }
};



// GET: Get all notifications
export const getAllNotifications = async (req, res) => {
  try {
    const notes = await Notification.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName");

    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
