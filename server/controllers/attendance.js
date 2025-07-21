 import Attendance from "../models/attendanceModel.js";
 import User from "../models/userModel.js";
 
export const attend = async (req, res) => {
  const { date, records } = req.body;  

  try { 
    const cleanRecords = records.filter((r) => r.studentId && r.fullName && r.status);
    let entry = await Attendance.findOne({ date });

    if (entry) {
      entry.records = cleanRecords;
      await entry.save();
    } else {
      await Attendance.create({ date, records: cleanRecords });
    }

    res.status(200).json({ message: "Attendance saved!" });
  } catch (error) {
    console.error("Attendance mark error:", error);
    res.status(500).json({ error: "Failed to save attendance" });
  }
};


 export const attendanceOnDate = async (req, res) => {
  try {
    const { date } = req.params;

    const attendance = await Attendance.findOne({ date });

    if (!attendance) {
      return res.status(404).json({ message: "No attendance found" });
    }

    return res.status(200).json(attendance); // ✅ fixed: send plain object
  } catch (err) {
    res.status(500).json({ error: "Error while getting Data", err });
  }
};


// GET /api/attendance/user/:studentId
export const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;

    const allAttendance = await Attendance.find({
      "records.studentId": studentId,
    });

    const mapped = {};
    allAttendance.forEach((entry) => {
      const record = entry.records.find((r) => r.studentId.toString() === studentId.toString());
      if (record) mapped[entry.date] = record.status;
    });

    res.status(200).json(mapped);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

