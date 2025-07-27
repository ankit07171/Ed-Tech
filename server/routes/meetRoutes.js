import express from "express";
import { createMeet, validateMeet } from "../controllers/meetController.js";
import protect from "../middleware/protectRoute.js";
import { restrictTo } from "../middleware/restrictTo.js";

const router = express.Router();

router.post("/create", protect,restrictTo("teacher"), createMeet);
router.post("/join",protect, validateMeet);

export default router;
