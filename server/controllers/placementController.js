import Placement from "../models/placementModel.js";
import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";

/**
 * Add new placement record
 */
export const addPlacement = async (req, res) => {
  try {
    const {
      studentName,
      studentId,
      department,
      company,
      package: packageAmount,
      role,
      placementType,
      year,
      month,
      cgpa,
      location,
    } = req.body;

    if (!studentName || !company || !packageAmount || !role || !year || !department) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const placement = new Placement({
      studentName,
      studentId,
      department,
      company,
      package: packageAmount,
      role,
      placementType: placementType || "On-Campus",
      year,
      month,
      cgpa,
      location,
    });

    await placement.save();

    res.status(201).json({
      message: "Placement record added successfully",
      placement,
    });
  } catch (error) {
    console.error("Add placement error:", error);
    res.status(500).json({ error: "Failed to add placement record" });
  }
};

/**
 * Get all placements with filters
 */
export const getAllPlacements = async (req, res) => {
  try {
    const { year, department, company, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (year) filter.year = parseInt(year);
    if (department) filter.department = department;
    if (company) filter.company = new RegExp(company, "i");

    const placements = await Placement
      .find(filter)
      .populate("department", "name code")
      .populate("studentId", "fullName email rollNumber")
      .sort({ year: -1, package: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Placement.countDocuments(filter);

    res.status(200).json({
      placements,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get placements error:", error);
    res.status(500).json({ error: "Failed to fetch placements" });
  }
};

/**
 * Get placement statistics
 */
export const getPlacementStats = async (req, res) => {
  try {
    const { year, department } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const filter = { year: currentYear };
    if (department) filter.department = department;

    // Total placements
    const totalPlacements = await Placement.countDocuments(filter);

    // Average package
    const avgResult = await Placement.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgPackage: { $avg: "$package" },
          maxPackage: { $max: "$package" },
          minPackage: { $min: "$package" },
        },
      },
    ]);

    const stats = avgResult[0] || {
      avgPackage: 0,
      maxPackage: 0,
      minPackage: 0,
    };

    // Placements by type
    const byType = await Placement.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$placementType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Top companies
    const topCompanies = await Placement.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$company",
          count: { $sum: 1 },
          avgPackage: { $avg: "$package" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Package distribution
    const packageRanges = await Placement.aggregate([
      { $match: filter },
      {
        $bucket: {
          groupBy: "$package",
          boundaries: [0, 3, 5, 7, 10, 15, 20, 50],
          default: "50+",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    res.status(200).json({
      year: currentYear,
      totalPlacements,
      avgPackage: parseFloat(stats.avgPackage.toFixed(2)),
      maxPackage: stats.maxPackage,
      minPackage: stats.minPackage,
      byType,
      topCompanies,
      packageRanges,
    });
  } catch (error) {
    console.error("Get placement stats error:", error);
    res.status(500).json({ error: "Failed to fetch placement statistics" });
  }
};

/**
 * Get placement trends (year-over-year)
 */
export const getPlacementTrends = async (req, res) => {
  try {
    const { department, years = 5 } = req.query;
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - parseInt(years);

    const filter = { year: { $gte: startYear } };
    if (department) filter.department = department;

    const trends = await Placement.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$year",
          totalPlacements: { $sum: 1 },
          avgPackage: { $avg: "$package" },
          maxPackage: { $max: "$package" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(trends);
  } catch (error) {
    console.error("Get placement trends error:", error);
    res.status(500).json({ error: "Failed to fetch placement trends" });
  }
};

/**
 * Get department-wise placement stats
 */
export const getDepartmentWiseStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const stats = await Placement.aggregate([
      { $match: { year: currentYear } },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      { $unwind: "$departmentInfo" },
      {
        $group: {
          _id: "$department",
          departmentName: { $first: "$departmentInfo.name" },
          departmentCode: { $first: "$departmentInfo.code" },
          totalPlacements: { $sum: 1 },
          avgPackage: { $avg: "$package" },
          maxPackage: { $max: "$package" },
        },
      },
      { $sort: { totalPlacements: -1 } },
    ]);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Get department-wise stats error:", error);
    res.status(500).json({ error: "Failed to fetch department-wise statistics" });
  }
};

/**
 * Get monthly placement trends
 */
export const getMonthlyTrends = async (req, res) => {
  try {
    const { year, department } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const filter = { year: currentYear };
    if (department) filter.department = department;

    const monthlyData = await Placement.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$month",
          count: { $sum: 1 },
          avgPackage: { $avg: "$package" },
        },
      },
      {
        $project: {
          month: "$_id",
          count: 1,
          avgPackage: { $round: ["$avgPackage", 2] },
        },
      },
    ]);

    // Order by month
    const monthOrder = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const orderedData = monthOrder.map(month => {
      const data = monthlyData.find(d => d.month === month);
      return {
        month,
        count: data?.count || 0,
        avgPackage: data?.avgPackage || 0,
      };
    });

    res.status(200).json(orderedData);
  } catch (error) {
    console.error("Get monthly trends error:", error);
    res.status(500).json({ error: "Failed to fetch monthly trends" });
  }
};

/**
 * Get top recruiters
 */
export const getTopRecruiters = async (req, res) => {
  try {
    const { year, limit = 20 } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const recruiters = await Placement.aggregate([
      { $match: { year: currentYear } },
      {
        $group: {
          _id: "$company",
          totalHires: { $sum: 1 },
          avgPackage: { $avg: "$package" },
          maxPackage: { $max: "$package" },
          roles: { $addToSet: "$role" },
        },
      },
      { $sort: { totalHires: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          company: "$_id",
          totalHires: 1,
          avgPackage: { $round: ["$avgPackage", 2] },
          maxPackage: 1,
          roles: 1,
        },
      },
    ]);

    res.status(200).json(recruiters);
  } catch (error) {
    console.error("Get top recruiters error:", error);
    res.status(500).json({ error: "Failed to fetch top recruiters" });
  }
};

/**
 * Update placement record
 */
export const updatePlacement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const placement = await Placement.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!placement) {
      return res.status(404).json({ error: "Placement record not found" });
    }

    res.status(200).json({
      message: "Placement record updated successfully",
      placement,
    });
  } catch (error) {
    console.error("Update placement error:", error);
    res.status(500).json({ error: "Failed to update placement record" });
  }
};

/**
 * Delete placement record
 */
export const deletePlacement = async (req, res) => {
  try {
    const { id } = req.params;

    const placement = await Placement.findByIdAndDelete(id);

    if (!placement) {
      return res.status(404).json({ error: "Placement record not found" });
    }

    res.status(200).json({ message: "Placement record deleted successfully" });
  } catch (error) {
    console.error("Delete placement error:", error);
    res.status(500).json({ error: "Failed to delete placement record" });
  }
};

/**
 * Get available years
 */
export const getAvailableYears = async (req, res) => {
  try {
    const years = await Placement.distinct("year");
    res.status(200).json(years.sort((a, b) => b - a));
  } catch (error) {
    console.error("Get available years error:", error);
    res.status(500).json({ error: "Failed to fetch years" });
  }
};

export default {
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
};
