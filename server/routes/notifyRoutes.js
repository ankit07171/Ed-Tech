import express from "express";
import { createNotification, getAllNotifications } from "../controllers/notification.js";
import protect from "../middleware/protectRoute.js";
import { restrictTo } from "../middleware/restrictTo.js";

const router = express.Router();

router.post("/create",protect,restrictTo("teacher"), createNotification);
router.get("/all",protect, getAllNotifications);

export default router;
