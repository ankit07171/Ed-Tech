import { nanoid } from "nanoid";
import Meet from "../models/meetModel.js";

export const createMeet = async (req, res) => {
  const teacherId = req.user.id;

  try {
    let code;
    let exists = true;

    // keep generating until unique
    while (exists) {
      code = nanoid(6).toUpperCase(); // like "ABC123"
      const existing = await Meet.findOne({ code });
      if (!existing) exists = false;
    }

    const meet = await Meet.create({
      code,
      createdBy: teacherId,
    });

    res.status(201).json({ message: "Meet created", code }); // 👈 return code
  } catch (err) {
    console.error("Create Meet Error:", err);
    res.status(500).json({ error: "Failed to create meet" });
  }
};



export const validateMeet = async (req, res) => {
  const { code } = req.body;
  try {
    const meet = await Meet.findOne({ code });
    if (!meet) return res.status(404).json({ error: "Meet not found" });
    res.status(200).json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to validate code" });
  }
};
