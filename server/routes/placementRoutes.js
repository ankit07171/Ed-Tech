import express from "express";
import {
  addPlacement,
  getAllPlacements,
  getPlacementStats,
  getPlacementTrends,
  getDepartmentWiseStats,
  getMonthlyTrends,
  getTopRecruiters,
  updatePlacement,
  deletePlacement,
  getAvailableYears,
} from "../controllers/placementController.js";
import protect from "../middleware/protectRoute.js";
import { restrictTo } from "../middleware/restrictTo.js";

const router = express.Router();

// Public/student accessible endpoints (stats and viewing)
router.get("/", protect, getAllPlacements);
router.get("/stats", protect, getPlacementStats);
router.get("/trends", protect, getPlacementTrends);
router.get("/department-wise", protect, getDepartmentWiseStats);
router.get("/monthly", protect, getMonthlyTrends);
router.get("/top-recruiters", protect, getTopRecruiters);
router.get("/years", protect, getAvailableYears);

// Admin/Teacher only endpoints (CRUD operations)
router.post("/", protect, restrictTo("teacher", "admin"), addPlacement);
router.put("/:id", protect, restrictTo("teacher", "admin"), updatePlacement);
router.delete("/:id", protect, restrictTo("teacher", "admin"), deletePlacement);

export default router;
