import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import {
  FiBriefcase,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiFilter,
  FiX,
} from "react-icons/fi";

export default function Placements() {
  const [placements, setPlacements] = useState([]);
  const [stats, setStats] = useState(null);
  const [topRecruiters, setTopRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchData();
    fetchYears();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedYear || selectedDepartment) {
      fetchFilteredPlacements();
    } else {
      fetchPlacements();
    }
  }, [selectedYear, selectedDepartment]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, recruitersRes] = await Promise.all([
        axios.get("/api/placements/stats"),
        axios.get("/api/placements/top-recruiters"),
      ]);
      setStats(statsRes.data);
      setTopRecruiters(recruitersRes.data);
    } catch (error) {
      console.error("Error fetching placement data:", error);
      toast.error("Failed to load placement statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlacements = async () => {
    try {
      const response = await axios.get("/api/placements");
      setPlacements(response.data.slice(0, 20)); // Show recent 20
    } catch (error) {
      console.error("Error fetching placements:", error);
    }
  };

  const fetchFilteredPlacements = async () => {
    try {
      const params = {};
      if (selectedYear) params.year = selectedYear;
      if (selectedDepartment) params.department = selectedDepartment;

      const response = await axios.get("/api/placements", { params });
      setPlacements(response.data.slice(0, 20));
    } catch (error) {
      console.error("Error fetching filtered placements:", error);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await axios.get("/api/placements/years");
      setAvailableYears(response.data);
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/auth/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const clearFilters = () => {
    setSelectedYear("");
    setSelectedDepartment("");
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Placement Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View placement records and analytics
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <FiUsers size={32} className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Total</span>
              </div>
              <h3 className="text-3xl font-bold">{stats.totalPlacements}</h3>
              <p className="text-sm opacity-90 mt-1">Students Placed</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <FiDollarSign size={32} className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Average</span>
              </div>
              <h3 className="text-3xl font-bold">₹{stats.averagePackage}L</h3>
              <p className="text-sm opacity-90 mt-1">Package (LPA)</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <FiTrendingUp size={32} className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Highest</span>
              </div>
              <h3 className="text-3xl font-bold">₹{stats.highestPackage}L</h3>
              <p className="text-sm opacity-90 mt-1">Package (LPA)</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <FiBriefcase size={32} className="opacity-80" />
                <span className="text-sm font-medium opacity-90">Companies</span>
              </div>
              <h3 className="text-3xl font-bold">{stats.totalCompanies}</h3>
              <p className="text-sm opacity-90 mt-1">Recruiters</p>
            </div>
          </div>
        )}

        {/* Top Recruiters */}
        {topRecruiters.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              🏆 Top Recruiters
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topRecruiters.slice(0, 10).map((recruiter, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-600"
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    {recruiter.company}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {recruiter.count} {recruiter.count === 1 ? "hire" : "hires"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.code}>
                  {dept.name}
                </option>
              ))}
            </select>

            {(selectedYear || selectedDepartment) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
              >
                <FiX size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Placements Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Recent Placements
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Package (LPA)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Year
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {placements.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No placement records found
                    </td>
                  </tr>
                ) : (
                  placements.map((placement) => (
                    <tr
                      key={placement._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                        {placement.studentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {placement.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                        {placement.companyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        ₹{placement.packageLPA}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {placement.year}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
