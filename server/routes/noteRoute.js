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

const upload = multer({ storage });

router.post("/upload", protect, restrictTo("teacher"),upload.single("file"), uploadNote);
router.get("/all",protect, getAllNotes);
router.delete("/delete/:id", protect,restrictTo("teacher"), deleteNote);

export default router;
