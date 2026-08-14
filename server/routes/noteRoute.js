import express from "express";
import multer from "multer";
import path from "path";
import { uploadNote, getAllNotes } from "../controllers/noteController.js";
import protect from "../middleware/protectRoute.js";
import { deleteNote } from "../controllers/noteController.js";
import { restrictTo } from "../middleware/restrictTo.js";



const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

// Only allow document/image types teachers actually share as notes, and cap
// size so a single upload can't fill the disk or smuggle in an executable.
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
]);

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Unsupported file type. Allowed: PDF, Word, PowerPoint, PNG, JPG."));
    }
    cb(null, true);
  },
});

router.post("/upload", protect, restrictTo("teacher"), upload.single("file"), uploadNote);
router.get("/all",protect, getAllNotes);
router.delete("/delete/:id", protect,restrictTo("teacher"), deleteNote);

export default router;
