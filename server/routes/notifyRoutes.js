import express from "express";
import { createNotification, getAllNotifications } from "../controllers/notification.js";
import protect from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/create",protect, createNotification);
router.get("/all", getAllNotifications);

export default router;
