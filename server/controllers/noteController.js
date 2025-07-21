import Note from "../models/noteModel.js";
import User from "../models/userModel.js";

export const uploadNote = async (req, res) => {
  try {
    const { title } = req.body;
    const filePath = req.file.path;
    const uploadedBy = req.user.id;

    const teacher = await User.findById(uploadedBy);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can upload" });
    }

    const note = await Note.create({ title, filePath, uploadedBy });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

export const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find().populate("uploadedBy", "fullName");
    res.status(200).json(notes);
  } catch {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};





import fs from "fs";
import path from "path";

export const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    // Check if the logged-in user is the uploader
    if (note.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete file from disk
    fs.unlink(note.filePath, (err) => {
      if (err) console.warn("File deletion failed:", err.message);
    });

    // Delete note from DB
    await Note.findByIdAndDelete(noteId);

    res.status(200).json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete note", details: err.message });
  }
};
