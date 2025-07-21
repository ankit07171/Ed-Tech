import express from "express";
import { createMeet, validateMeet } from "../controllers/meetController.js";
import protect from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/create", protect, createMeet);
router.post("/join", validateMeet);

export default router;
